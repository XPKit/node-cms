import{H as F}from"./codemirror-BF7KXh6i.js";import{n as W}from"./vendor-Cl56otIo.js";import{d as _,a as v,s as q,g as J,b as $,u as h,e as x,o as Z,f as k,i as M,j as G,k as Q,l as K,p as X,q as Y,n as ee,t as j,m as T}from"./@vue-CW8kyeb2.js";!window.CodeMirror&&(window.CodeMirror=F);const C=window.CodeMirror||F,te=_({name:"DefaultMode",props:{name:{type:String,default:`cm-textarea-${+new Date}`},value:{type:String,default:""},content:{type:String,default:""},options:{type:Object,default:()=>({})},cminstance:{type:Object,default:()=>null},placeholder:{type:String,default:""}},emits:{ready:e=>e,"update:cminstance":e=>e},setup(e,{emit:o}){const a=v(),n=v(null),t=()=>{n.value=T(C.fromTextArea(a.value,e.options)),o("update:cminstance",n.value);const r=x(()=>e.cminstance,i=>{var c;i&&((c=e.cminstance)==null||c.setValue(e.value||e.content)),o("ready",h(n)),r==null||r()},{deep:!0})};return j(()=>{t()}),{textarea:a,initialize:t}}}),D=(e,o)=>{const a=e.__vccOpts||e;for(const[n,t]of o)a[n]=t;return a},re=["name","placeholder"];function ne(e,o,a,n,t,r){return k(),M("textarea",{ref:"textarea",name:e.$props.name,placeholder:e.$props.placeholder},null,8,re)}const B=D(te,[["render",ne]]);window.diff_match_patch=W;window.DIFF_DELETE=-1;window.DIFF_INSERT=1;window.DIFF_EQUAL=0;const oe=_({name:"MergeMode",props:{options:{type:Object,default:()=>({})},cminstance:{type:Object,default:()=>({})}},emits:["update:cminstance","ready"],setup(e,{emit:o}){const a=v(),n=v(),t=()=>{a.value=T(C.MergeView(n.value,e.options)),o("update:cminstance",a.value),o("ready",a)};return j(()=>{t()}),{mergeView:n,initialize:t}}}),ie={ref:"mergeView"};function ae(e,o,a,n,t,r){return k(),M("div",ie,null,512)}const le=D(oe,[["render",ae]]);function ce(e){const o=/#link#(.+)#link#/g,a=[];let n;for(n=o.exec(e);n;){const t=document.createElement("a"),r=JSON.parse(n[1]),i=Object.entries(r);for(const[c,l]of i)t.setAttribute(c,l);t.className="editor_custom_link",t.innerHTML="logDownload",a.push({start:n.index,end:n.index+n[0].length,node:t}),n=o.exec(e)}return a}function se(e){const o=[];function a(){const n=/#log<(\w*)>log#((.|\r\n|\n)*?)#log<(\w*)>log#/g;let t;for(t=n.exec(e);t;){const r=t[0].replace(/\r\n/g,`
`).split(`
`),i=t[2].replace(/\r\n/g,`
`).split(`
`),c=document.createElement("span"),l=t[1];c.className=`c-editor--log__${l}`;let d=0;for(let m=0;m<r.length;m++){const u=r[m],g=i[m],y=c.cloneNode(!1);y.innerText=g,o.push({start:t.index+d,end:t.index+d+u.length,node:y}),d=d+u.length+1}t=n.exec(e)}}return a(),o}const S=[{regex:/(\[.*?\])([ \t]*)(<error>[ \t])(.+)/,token:["tag","","error.strong","error.strong"],sol:!0},{regex:/(\[.*?\])([ \t]*)(<info>)(.+)(.?)/,token:["tag","","bracket","bracket","hr"],sol:!0},{regex:/(\[.*?\])([ \t]*)(<warning>)(.+)(.?)/,token:["tag","","comment","comment","hr"],sol:!0}];C.defineSimpleMode("fclog",{start:[...S,{regex:/.*/,token:"hr"}],error:[...S,{regex:/.*/,token:"error.strong"}],info:[...S,{regex:/.*/,token:"bracket"}],warning:[...S,{regex:/.*\[/,token:"comment"}]});C.defineSimpleMode("log",{start:[{regex:/^[=]+[^=]*[=]+/,token:"strong"},{regex:/([^\w])([A-Z][\w]*)/,token:["","string"]},{regex:/(^[A-Z][\w]*)/,token:"string"}]});const ue=_({name:"CodemirrorFclog",props:{value:{type:String,default:""},name:{type:String,default:`cm-textarea-${+new Date}`},options:{type:Object,default:()=>({})},cminstance:{type:Object,default:()=>({})},placeholder:{type:String,default:""}},emits:["update:cminstance","ready"],setup(e,{emit:o}){const a=v(),n=v(null),t=(i=e.cminstance)=>{i.getAllMarks().forEach(d=>d.clear());const c=i.getValue(),l=[].concat(ce(c)).concat(se(c));for(let d=0;d<l.length;d++){const m=l[d];i.markText(i.posFromIndex(m.start),i.posFromIndex(m.end),{replacedWith:m.node})}},r=()=>{var i;n.value=T(C.fromTextArea(a.value,e.options)),o("update:cminstance",h(n)),(i=n.value)==null||i.on("change",t)};return x(()=>e.cminstance,i=>{var c;i&&(t(e.cminstance),(c=e.cminstance)==null||c.setValue(e.value),o("ready",n))},{deep:!0,immediate:!0}),j(()=>{r()}),{initialize:r,textarea:a}}}),de=["name","placeholder"];function pe(e,o,a,n,t,r){return k(),M("textarea",{ref:"textarea",name:e.$props.name,placeholder:e.$props.placeholder},null,8,de)}const me=D(ue,[["render",pe]]),N={"update:value":()=>!0,change:(e,o)=>({value:e,cm:o}),input:()=>!0,ready:e=>e},ge=["changes","scroll","beforeChange","cursorActivity","keyHandled","inputRead","electricInput","beforeSelectionChange","viewportChange","swapDoc","gutterClick","gutterContextMenu","focus","blur","refresh","optionChange","scrollCursorIntoView","update"],fe=()=>{const e={};return ge.forEach(o=>{e[o]=(...a)=>a}),e},he={...N,...fe()},I={mode:"text",theme:"default",lineNumbers:!0,smartIndent:!0,indentUnit:2};function ve(e){Promise.resolve().then(()=>{const o=e.getScrollInfo();e.scrollTo(o.left,o.height)})}const ye=({props:e,cminstance:o,emit:a,internalInstance:n,content:t})=>{const r=$(()=>{var c;return e.merge?(c=h(o))==null?void 0:c.editor():h(o)}),i=()=>{const c=[];return Object.keys(n==null?void 0:n.vnode.props).forEach(l=>{if(l.startsWith("on")){const d=l.replace(l[2],l[2].toLowerCase()).slice(2);!N[d]&&c.push(d)}}),c};return{listenerEvents:()=>{r.value.on("change",l=>{const d=l.getValue();d===t.value&&d!==""||(t.value=d,a("update:value",t.value||""),a("input",t.value||" "),Promise.resolve().then(()=>{a("change",t.value,l)}),e.keepCursorInEnd&&ve(l))});const c={};i().filter(l=>!c[l]&&(c[l]=!0)).forEach(l=>{r.value.on(l,(...d)=>{a(l,...d)})})}}};function we({props:e,cminstance:o,presetRef:a}){const n=v(null),t=v(null),r=$(()=>{var u;return e.merge?(u=h(o))==null?void 0:u.editor():h(o)}),i=()=>{ee(()=>{var u;(u=r.value)==null||u.refresh()})},c=(u=e.width,g=e.height)=>{var y;n.value=String(u).replace("px",""),t.value=String(g).replace("px","");const b=t.value;(y=r.value)==null||y.setSize(n.value,b)},l=()=>{var u;const g=(u=r.value)==null?void 0:u.getWrapperElement();g==null||g.remove()},d=()=>{var u,g,y;const b=(u=r.value)==null?void 0:u.getDoc().getHistory();(g=a.value)==null||g.initialize(),l(),(y=r.value)==null||y.getDoc().setHistory(b)},m=()=>{const u=document.querySelector(".CodeMirror-gutters");return(u==null?void 0:u.style.left.replace("px",""))!=="0"};return{reload:d,refresh:i,resize:c,destroy:l,containerHeight:t,reviseStyle:()=>{if(i(),!m())return;const u=setInterval(()=>{m()?i():clearInterval(u)},60),g=setTimeout(()=>{clearInterval(u),clearTimeout(g)},400)}}}const Se=_({__name:"index",props:{value:{type:String,default:""},options:{type:Object,default:()=>I},globalOptions:{type:Object,default:()=>I},placeholder:{type:String,default:""},border:{type:Boolean,default:!1},width:{type:[String,Number],default:null},height:{type:[String,Number],default:null},originalStyle:{type:Boolean,default:!1},keepCursorInEnd:{type:Boolean,default:!1},merge:{type:Boolean,default:!1},name:{type:String,default:""},marker:{type:Function,default:()=>null},unseenLines:{type:Array,default:()=>[]}},emits:he,setup(e,{expose:o,emit:a}){var n,t;const r=e;typeof Object.assign!="function"&&Object.defineProperty(Object,"assign",{value(s){if(s==null)throw new TypeError("Cannot convert undefined or null to object");const p=Object(s);for(let f=1;f<arguments.length;f++){const w=arguments[f];if(w!=null)for(const O in w)Object.prototype.hasOwnProperty.call(w,O)&&(p[O]=w[O])}return p},writable:!0,configurable:!0});const i=v(null),c=v(""),l=q(B),d=v({...I,...r.globalOptions,...r.options}),m=J(),u=r.name||((t=(n=m==null?void 0:m.parent)==null?void 0:n.type)==null?void 0:t.name)||void 0,g=v(null),y=$(()=>{var s;return r.merge?(s=h(i))==null?void 0:s.editor():h(i)}),{refresh:b,resize:E,destroy:A,containerHeight:V,reviseStyle:R}=we({props:r,cminstance:i,presetRef:g}),{listenerEvents:H}=ye({props:r,cminstance:i,emit:a,internalInstance:m,content:c}),z=()=>{r.unseenLines!==void 0&&r.marker!==void 0&&r.unseenLines.forEach(s=>{var p,f;const w=(p=i.value)==null?void 0:p.lineInfo(s);(f=i.value)==null||f.setGutterMarker(s,"breakpoints",w!=null&&w.gutterMarkers?null:r.marker())})},L=s=>{var p,f;const w=(p=i.value)==null?void 0:p.getValue();s!==w&&((f=i.value)==null||f.setValue(s),c.value=s,R()),z()},P=()=>{H(),z(),E(r.width,r.height),a("ready",i.value),x([()=>r.width,()=>r.height],([s,p])=>{E(s,p)},{deep:!0})},U=()=>{if(r.options.mode==="fclog"||r.options.mode==="log"){l.value=me;return}if(r.merge){l.value=le;return}l.value=B};return x(()=>r.options,s=>{var p;for(const f in r.options)(p=y.value)==null||p.setOption(f,h(s[f]))},{deep:!0}),x(()=>r.value,s=>{L(s)}),x(()=>r.merge,U,{immediate:!0}),Z(()=>{A()}),o({cminstance:i,resize:E,refresh:b,destroy:A}),(s,p)=>(k(),M("div",{class:X(["codemirror-container",{merge:s.$props.merge,bordered:s.$props.border||s.$props.merge&&!r.originalStyle,"width-auto":!s.$props.width||s.$props.width=="100%","height-auto":!s.$props.height||s.$props.height=="100%","original-style":r.originalStyle}]),style:Y({height:h(V)+"px"})},[(k(),G(K(h(l)),Q({ref_key:"presetRef",ref:g,cminstance:i.value,"onUpdate:cminstance":p[0]||(p[0]=f=>i.value=f),style:{height:"100%"}},{...s.$props,...s.$attrs,options:d.value,name:h(u),content:c.value},{onReady:P}),null,16,["cminstance"]))],6))}});function xe(e,o){o===void 0&&(o={});var a=o.insertAt;if(!(!e||typeof document>"u")){var n=document.head||document.getElementsByTagName("head")[0],t=document.createElement("style");t.type="text/css",a==="top"&&n.firstChild?n.insertBefore(t,n.firstChild):n.appendChild(t),t.styleSheet?t.styleSheet.cssText=e:t.appendChild(document.createTextNode(e))}}xe(`.codemirror-container {
  position: relative;
  display: inline-block;
  height: 100%;
  width: fit-content;
  font-size: 12px;
  overflow: hidden;
}
.codemirror-container.bordered {
  border-radius: 4px;
  border: 1px solid #dddddd;
}
.codemirror-container.width-auto {
  width: 100%;
}
.codemirror-container.height-auto {
  height: 100%;
}
.codemirror-container.height-auto .CodeMirror,
.codemirror-container.height-auto .cm-s-default {
  height: 100% !important;
}
.codemirror-container .editor_custom_link {
  cursor: pointer;
  color: #1474f1;
  text-decoration: underline;
}
.codemirror-container .editor_custom_link:hover {
  color: #04b4fa;
}
.codemirror-container:not(.original-style) .CodeMirror-lines .CodeMirror-placeholder.CodeMirror-line-like {
  color: #666;
}
.codemirror-container:not(.original-style) .CodeMirror,
.codemirror-container:not(.original-style) .CodeMirror-merge-pane {
  height: 100%;
  font-family: consolas !important;
}
.codemirror-container:not(.original-style) .CodeMirror-merge,
.codemirror-container:not(.original-style) .CodeMirror-merge-right .CodeMirror {
  height: 100%;
  border: none !important;
}
.codemirror-container:not(.original-style) .c-editor--log__error {
  color: #bb0606;
  font-weight: bold;
}
.codemirror-container:not(.original-style) .c-editor--log__info {
  color: #333333;
  font-weight: bold;
}
.codemirror-container:not(.original-style) .c-editor--log__warning {
  color: #ee9900;
}
.codemirror-container:not(.original-style) .c-editor--log__success {
  color: #669600;
}
.codemirror-container:not(.original-style) .cm-header,
.codemirror-container:not(.original-style) .cm-strong {
  font-weight: bold;
}
`);export{Se as F};
