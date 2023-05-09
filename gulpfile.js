const autoBind = require('auto-bind')
const gulp = require('gulp')
const browserify = require('browserify')
const runSequence = require('gulp4-run-sequence')
const livereload = require('gulp-livereload')
const fs = require('fs')
const del = require('del')
const scss = require('gulp-sass')
const uglify = require('gulp-uglify-es').default
const pipeline = require('readable-stream').pipeline
const cleanCSS = require('gulp-clean-css')
const promisify = require('util').promisify
const source = require('vinyl-source-stream')
const express = require('express')
const injectReload = require('connect-livereload')
const _ = require('lodash')
const watchify = require('watchify')
const clean = require('semver').clean
const zip = require('gulp-zip')
const childExec = require('child_process').exec

const pkg = require('./package.json')
const CMS = require('./')

const path = require('path')
const logger = new (require(path.join(__dirname, 'lib/logger')))()

const exec = (command) => {
  return new Promise((resolve, reject) => {
    childExec(command, {maxBuffer: 200 * 4096}, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr)
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

const displayError = function (error) {
  let errorString = `[${error.plugin}]`
  errorString += ` ${error.message.replace('\n', '')}`
  if (error.fileName) {
    errorString += ` in ${error.fileName}`
  }
  if (error.lineNumber) {
    errorString += ` on line ${error.lineNumber}`
  }
  console.error(errorString)
  return this.emit('end')
}

const liveReloadPort = 30000
let createTasksCount = 1
class CreateTasks {
  constructor (name) {
    autoBind(this)
    this.name = name
    this.bundler = null
    this.liveReloadPort = liveReloadPort + (10 * createTasksCount)
    createTasksCount = createTasksCount + 1

    this.cleanTask = `clean-${this.name}`
    this.browserifyTask = `browserify-${this.name}`
    this.jsOnDiskTask = `js-on-disk-${this.name}`
    this.stylesTask = `styles-${this.name}`
    this.minStylesTask = `min-styles-${this.name}`
    this.minJSTask = `min-js-${this.name}`
    this.watchTask = `watch-${this.name}`
    this.reloadCssTask = `reloadcss-${this.name}`
    this.GitAddTask = `git-add-${this.name}`
    this.buildTasks = [this.browserifyTask, this.stylesTask]
    this.zipFiles = [
      `${this.name}/index.html*`,
      `${this.name}/scripts/**/*`,
      `${this.name}/styles/**/*`,
      `${this.name}/static/**/*`
    ]
  }

  createTasks () {
    this.createCleanTask()
    this.createStyleTask()
    this.createMinStyleTask()
    this.createBrowserifyTask()
    this.createJSOnDiskTask()
    this.createMinJSTask()
    this.createWatchTask()
    this.createReloadCSSTask()
  }

  createCleanTask () {
    gulp.task(this.cleanTask, done => del([
      `${this.name}/styles/**`,
      `${this.name}/scripts/*`
    ], done))
  }

  createStyleTask () {
    gulp.task(this.stylesTask, () => gulp.src(`./${this.name}/_scss/main.scss`)
      .pipe(scss())
      .on('error', scss.logError)
      .pipe(gulp.dest(`./${this.name}/styles/`))
      .pipe(gulp.dest(`./${this.name}/styles/`)))
  }

  createMinStyleTask () {
    gulp.task(this.minStylesTask, () => gulp.src(`./${this.name}/_scss/main.scss`)
      .pipe(scss())
      .on('error', scss.logError)
      .pipe(cleanCSS())
      .pipe(gulp.dest(`./${this.name}/styles/`)))
  }

  gulpBundle () {
    return this.bundler.bundle()
      .on('error', displayError)
      .pipe(source('bundle.js'))
      .pipe(gulp.dest(`./${this.name}/scripts`))
      .pipe(livereload())
  }

  createBrowserifyTask () {
    gulp.task(this.browserifyTask, async () => {
      const options = {
        debug: true,
        cache: {},
        packageCache: {}
      }

      this.bundler = browserify(options)
        .add(`${this.name}/_js/main.js`)
        .transform('vueify-babel-7-support')
        .transform('babelify')
        .on('update', this.gulpBundle)
      let doBundle = promisify(this.bundler.bundle.bind(this.bundler))
      await doBundle()
      return this.gulpBundle()
    })
  }

  checkFileOnDisk (fileName, done) {
    try {
      fs.statSync(fileName)
      done()
    } catch (error) {
      setTimeout(() => this.checkFileOnDisk(fileName, done), 2000)
    }
  }

  createJSOnDiskTask () {
    gulp.task(this.jsOnDiskTask, (done) => {
      this.checkFileOnDisk(`./${this.name}/scripts/bundle.js`, done)
    })
  }

  createMinJSTask () {
    gulp.task(this.minJSTask, () => {
      return pipeline(
        gulp.src(`${this.name}/scripts/bundle.js`),
        uglify(),
        gulp.dest(`${this.name}/scripts`)
      )
    })
  }

  createWatchTask () {
    gulp.task(this.watchTask, () => {
      livereload.listen({ port: pkg.config.port + this.liveReloadPort })
      gulp.watch([`./${this.name}/_scss/**/*.scss`], gulp.series(this.stylesTask))
      gulp.watch([`./${this.name}/**/*.html`], gulp.series(this.browserifyTask))
      gulp.watch([`./${this.name}/styles/main.css`], gulp.series(this.reloadCssTask))
      this.bundler.plugin(watchify)
        .on('error', displayError)
      return this.gulpBundle()
    })
  }

  createReloadCSSTask () {
    gulp.task(this.reloadCssTask, () => gulp
      .src(`./${this.name}/styles/main.css`)
      .pipe(livereload())
      .on('error', displayError)
    )
  }

  async gitAddFiles (callback) {
    try {
      await exec(`git add ./${this.name}/styles/main.css`)
      await exec(`git add ./${this.name}/scripts/bundle.js`)
    } catch (error) {
      throw error
    }
  }
}

class MainTask {
  constructor (subTasks) {
    autoBind(this)
    this.subTasks = subTasks
  }

  createTasks () {
    this.createCleanTask()
    this.createServerTask()
    this.createZipTask()
    this.createGlobalTasks()
    this.createBumpVersionTask()
    this.createNewRelease()
    _.forEach(this.subTasks, (subTask) => subTask.createTasks())
  }

  createCleanTask () {
    gulp.task('clean-main', done => del([`${pkg.name}.zip`], done))
    gulp.task('clean', done => runSequence('clean-main', _.map(this.subTasks, task => task.cleanTask), done))
  }

  createServerTask () {
    gulp.task('server', (done) => {
      let server
      const cms = new CMS()
      const app = express()
      _.forEach(this.subTasks, task => app.use(injectReload({
        port: pkg.config.port + task.liveReloadPort,
        ignore: [/\/api\//]
      })))
      app.use(cms.express())
      return server = app.listen(pkg.config.port, async () => {
        await cms.bootstrap()
        logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
        return done()
      })
    })
  }
  getDependency (node) {
    let list = []
    _.forEach(node.dependencies, (obj, key) => {
      list = _.union(list, [key], this.getDependency(obj))
    })
    return list
  }

  createZipTask () {
    gulp.task('zip', async (done) => {
      let srcList = [
        'data/**/*',
        'lib/**/*',
        'node_modules',
        'resources/**/*',
        '*.json',
        '*.js',
        '*.md',
        '*.service'
      ]

      _.forEach(this.subTasks, task => srcList = srcList.concat(task.zipFiles))
      try {
        const stdout = await exec('npm ls --production --json')
        const obj = JSON.parse(stdout)
        const dependencies = this.getDependency(obj)
        _.forEach(dependencies, item => {
          srcList.push(`./node_modules/${item}/**/*`)
        })
        return gulp.src(srcList, {base: '.'})
          .pipe(zip(`${pkg.name}.zip`))
          .pipe(gulp.dest('./'))
          .on('end', () => {
            done()
          })
      } catch (error) {
        if (error) {
          console.log(error)
          process.exit(1)
        }
      }
    })
  }

  async bumpVersion (fromVersion, type, callback) {
    try {
      let toVersion = clean(fromVersion)
      if (toVersion != null) {
        toVersion = toVersion.replace(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/, function () {
          if (type === 'major') {
            return `${Number(arguments[1]) + 1}.0.0`
          } else if (type === 'minor') {
            return `${arguments[1]}.${Number(arguments[2] + 1)}.0`
          } else {
            return `${arguments[1]}.${arguments[2]}.${Number(arguments[3]) + 1}`
          }
        })
        this.saveVersion(toVersion)
        await exec('npm install')
        pkg.version = toVersion
        callback()
      }
    } catch (error) {
      console.log(error)
      this.saveVersion(pkg.version)
      process.exit(1)
    }
  }

  createNewRelease () {
    gulp.task('git-release', async (done) => {
      try {
        for (const task of this.subTasks) {
          await task.gitAddFiles()
        }
        await exec(`git add package.json`)
        await exec(`git add package-lock.json`)
        await exec(`git commit -m "Bump to version ${pkg.version}"`)
        await exec(`git push origin`)
        await exec(`git tag -a "${pkg.version}" -m "\`git log -1 --format=%s\`"`)
        await exec(`git push origin --tags`)
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })
  }

  saveVersion (toVersion) {
    try {
      const packageJsonFile = './package.json'
      const packageJsonLockFile = './package-lock.json'
      const packageJson = require(packageJsonFile)
      packageJson.version = toVersion
      if (fs.statSync(packageJsonLockFile)) {
        fs.unlinkSync(packageJsonLockFile)
      }
      fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2))
    } catch (error) {
      console.error(`Failed to save new version ${toVersion}:`, error)
    }
  }

  createBumpVersionTask () {
    gulp.task('bump-major', async (done) => {
      await this.bumpVersion(pkg.version, 'major', done)
    })
    gulp.task('bump-minor', async (done) => {
      await this.bumpVersion(pkg.version, 'minor', done)
    })
    gulp.task('bump-patch', async (done) => {
      await this.bumpVersion(pkg.version, 'patch', done)
    })
  }

  createGlobalTasks () {
    gulp.task('browserify', done => runSequence(_.map(this.subTasks, task => task.browserifyTask), _.map(this.subTasks, task => task.jsOnDiskTask), done))
    gulp.task('styles', done => runSequence(_.map(this.subTasks, task => task.stylesTask), done))
    gulp.task('min-styles', done => runSequence(_.map(this.subTasks, task => task.minStylesTask), done))
    gulp.task('min-js', done => runSequence(_.map(this.subTasks, task => task.minJSTask), done))
    gulp.task('watch', done => runSequence(_.map(this.subTasks, task => task.watchTask), done))
    gulp.task('build', done => runSequence('clean', ['browserify', 'styles'], done))
    gulp.task('release', done => runSequence('clean', 'bump-patch', 'browserify', 'styles', 'min-styles', 'min-js', 'git-release', done))
    gulp.task('release-minor', done => runSequence('clean', 'bump-minor', 'browserify', 'styles', 'min-styles', 'min-js', 'git-release', done))
    gulp.task('release-major', done => runSequence('clean', 'bump-major', 'browserify', 'styles', 'min-styles', 'min-js', 'git-release', done))
    gulp.task('start', done => runSequence('build', 'watch', 'server', done))
    gulp.task('dev', done => runSequence('build', 'watch', done))
    gulp.task('default', done => runSequence('clean', ['browserify', 'styles'], 'watch', 'server', done))
  }
}

const AppTasks = new CreateTasks('app')

const mainTask = new MainTask([AppTasks])
mainTask.createTasks()
