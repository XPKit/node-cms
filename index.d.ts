/**
 * Node CMS TypeScript/JSDoc Definitions
 * This file is automatically loaded by IDEs when node-cms is used as a dependency
 */

declare module 'node-cms' {
  /**
   * CMS Record with all standard fields
   */
  interface CMSRecord {
    /** Record ID */
    _id: string;
    /** Creation timestamp */
    _createdAt: number;
    /** Update timestamp */
    _updatedAt: number;
    /** Published timestamp */
    _publishedAt?: number;
    /** Updated by user */
    _updatedBy?: string;
    /** Attachments */
    _attachments?: Attachment[];
    /** Whether record is local */
    _local?: boolean;
    /** Dynamic fields based on schema */
    [key: string]: any;
  }

  /**
   * File attachment
   */
  interface Attachment {
    /** Attachment ID */
    _id: string;
    /** Creation timestamp */
    _createdAt: number;
    /** Update timestamp */
    _updatedAt: number;
    /** Attachment name/field */
    _name: string;
    /** Content type */
    _contentType: string;
    /** MD5 hash */
    _md5sum: string;
    /** File size */
    _size: number;
    /** Original filename */
    _filename: string;
    /** Additional payload */
    _payload?: any;
    /** Form fields */
    _fields?: any;
    /** Crop options */
    cropOptions?: any;
    /** Order */
    order?: number;
    /** Stream (when reading) */
    stream?: NodeJS.ReadableStream;
  }

  /**
   * Query options for resource operations
   */
  interface QueryOptions {
    /** Page number */
    page?: number;
    /** Limit per page */
    limit?: number;
    /** Locale */
    locale?: string;
  }

  /**
   * Resource API Interface - Available through api('resourceName')
   * This interface defines all methods available on resource APIs
   */
  interface ResourceAPI {
    /**
     * List all records matching query
     * @example const articles = await api('articles').list()
     * @example const published = await api('articles').list({ published: true })
     */
    list(query?: any, options?: QueryOptions): Promise<CMSRecord[]>;

    /**
     * Find a single record by ID or query
     * @example const article = await api('articles').find('article-id')
     * @example const article = await api('articles').find({ slug: 'my-article' })
     */
    find(idOrQuery: string | any, options?: QueryOptions): Promise<CMSRecord>;

    /**
     * Check if a record exists
     * @example const exists = await api('articles').exists('article-id')
     */
    exists(idOrQuery: string | any): Promise<boolean>;

    /**
     * Create a new record
     * @example const article = await api('articles').create({ title: 'New Article' })
     */
    create(data: Partial<CMSRecord>, options?: any): Promise<CMSRecord>;

    /**
     * Update an existing record
     * @example await api('articles').update('article-id', { title: 'Updated' })
     */
    update(id: string, data: Partial<CMSRecord>, options?: any): Promise<CMSRecord>;

    /**
     * Remove a record
     * @example await api('articles').remove('article-id')
     */
    remove(id: string): Promise<boolean>;

    /**
     * Create an attachment for a record
     * @example
     * const attachment = await api('articles').createAttachment('article-id', {
     *   name: 'photo',
     *   stream: fs.createReadStream('photo.jpg'),
     *   fields: { _filename: 'photo.jpg' }
     * })
     */
    createAttachment(id: string, attachment: {
      name: string;
      stream: NodeJS.ReadableStream;
      fields?: any;
      payload?: any;
      cropOptions?: any;
      order?: number;
    }): Promise<Attachment>;

    /**
     * Update an attachment
     */
    updateAttachment(id: string, aid: string, data: Partial<Attachment>): Promise<Attachment>;

    /**
     * Find an attachment
     * @example const attachment = await api('articles').findAttachment('record-id', 'attachment-id')
     */
    findAttachment(id: string, aid: string): Promise<Attachment>;

    /**
     * Remove an attachment
     * @example await api('articles').removeAttachment('record-id', 'attachment-id')
     */
    removeAttachment(id: string, aid: string): Promise<boolean>;

    /**
     * Find a file stream by attachment ID
     * @example const stream = await api('articles').findFile('attachment-id')
     */
    findFile(aid: string): Promise<NodeJS.ReadableStream>;

    /**
     * Clean orphaned attachments
     * @example await api('articles').cleanAttachment()
     */
    cleanAttachment(): Promise<boolean>;

    /**
     * Get import map for bulk operations
     */
    getImportMap(importList: any[], query?: any, checkRequired?: boolean): Promise<{
      create: CMSRecord[];
      update: CMSRecord[];
      remove: CMSRecord[];
    }>;

    /**
     * Get unique keys for this resource
     * @example const uniqueKeys = api('articles').getUniqueKeys()
     */
    getUniqueKeys(): string[];
  }

  /**
   * CMS Configuration Options
   */
  interface CMSOptions {
    /** Namespace array */
    ns?: string[];
    /** Resources directory path */
    resources?: string;
    /** Data directory path */
    data?: string;
    /** Auto-load resources */
    autoload?: boolean;
    /** CMS mode */
    mode?: 'normal' | string;
    /** Machine ID */
    mid?: string;
    /** Disable REST API */
    disableREST?: boolean;
    /** Disable admin interface */
    disableAdmin?: boolean;
    /** Disable JWT login */
    disableJwtLogin?: boolean;
    /** Disable replication */
    disableReplication?: boolean;
    /** Disable authentication */
    disableAuthentication?: boolean;
    /** Enable WebSocket record updates */
    wsRecordUpdates?: boolean;
    /** Enable import from remote */
    importFromRemote?: boolean;
    /** Disable anonymous access */
    disableAnonymous?: boolean;
    /** API version */
    apiVersion?: number;
    /** Session configuration */
    session?: {
      secret: string;
      resave?: boolean;
      saveUninitialized?: boolean;
    };
    /** Authentication configuration */
    auth?: {
      secret: string;
    };
    [key: string]: any;
  }

  /**
   * Main CMS Class
   */
  class CMS {
    /**
     * Create a new CMS instance
     * @example
     * const CMS = require('node-cms')
     * const cms = new CMS({
     *   resources: './resources',
     *   data: './data'
     * })
     */
    constructor(options?: CMSOptions);

    /**
     * Get API interface for resources
     * @returns Function that returns ResourceAPI for any resource name
     * @example
     * const api = cms.api()
     * const groups = await api('_groups').list()
     * const users = await api('_users').find('user-id')
     */
    api(): {
      /**
       * Create a resource API for the specified resource name
       * @param resourceName The name of the resource (e.g., '_groups', 'articles')
       * @param resolves Additional resolves
       * @returns ResourceAPI instance with all CRUD and attachment methods
       */
      (resourceName: string, ...resolves: string[]): ResourceAPI
    };

    /**
     * Define or get a resource
     */
    resource(name: string, config?: any, resolves?: string[]): ResourceAPI;

    /**
     * Use a plugin
     */
    use(plugin: any, options?: any, configPath?: string): any;

    /**
     * Get Express app
     */
    express(): any;

    /**
     * Bootstrap the CMS
     */
    bootstrap(server?: any, callback?: () => void): Promise<void>;
    bootstrap(callback: () => void): Promise<void>;

    /**
     * Broadcast a message
     */
    broadcast(message: {
      action: string;
      data: any;
    }): void;

    /** CMS options */
    options: CMSOptions;
  }

  export = CMS;
}
