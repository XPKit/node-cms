import{S as w,F as g,M as re,R as ne,d as ie}from"./prosemirror-model-BEHzNbie.js";const K=65535,Q=Math.pow(2,16);function se(s,e){return s+e*Q}function $(s){return s&K}function oe(s){return(s-(s&K))/Q}const U=1,V=2,A=4,X=8;class L{constructor(e,t,r){this.pos=e,this.delInfo=t,this.recover=r}get deleted(){return(this.delInfo&X)>0}get deletedBefore(){return(this.delInfo&(U|A))>0}get deletedAfter(){return(this.delInfo&(V|A))>0}get deletedAcross(){return(this.delInfo&A)>0}}class x{constructor(e,t=!1){if(this.ranges=e,this.inverted=t,!e.length&&x.empty)return x.empty}recover(e){let t=0,r=$(e);if(!this.inverted)for(let n=0;n<r;n++)t+=this.ranges[n*3+2]-this.ranges[n*3+1];return this.ranges[r*3]+t+oe(e)}mapResult(e,t=1){return this._map(e,t,!1)}map(e,t=1){return this._map(e,t,!0)}_map(e,t,r){let n=0,i=this.inverted?2:1,o=this.inverted?1:2;for(let l=0;l<this.ranges.length;l+=3){let a=this.ranges[l]-(this.inverted?n:0);if(a>e)break;let h=this.ranges[l+i],p=this.ranges[l+o],f=a+h;if(e<=f){let c=h?e==a?-1:e==f?1:t:t,d=a+n+(c<0?0:p);if(r)return d;let u=e==(t<0?a:f)?null:se(l/3,e-a),m=e==a?V:e==f?U:A;return(t<0?e!=a:e!=f)&&(m|=X),new L(d,m,u)}n+=p-h}return r?e+n:new L(e+n,0,null)}touches(e,t){let r=0,n=$(t),i=this.inverted?2:1,o=this.inverted?1:2;for(let l=0;l<this.ranges.length;l+=3){let a=this.ranges[l]-(this.inverted?r:0);if(a>e)break;let h=this.ranges[l+i],p=a+h;if(e<=p&&l==n*3)return!0;r+=this.ranges[l+o]-h}return!1}forEach(e){let t=this.inverted?2:1,r=this.inverted?1:2;for(let n=0,i=0;n<this.ranges.length;n+=3){let o=this.ranges[n],l=o-(this.inverted?i:0),a=o+(this.inverted?0:i),h=this.ranges[n+t],p=this.ranges[n+r];e(l,l+h,a,a+p),i+=p-h}}invert(){return new x(this.ranges,!this.inverted)}toString(){return(this.inverted?"-":"")+JSON.stringify(this.ranges)}static offset(e){return e==0?x.empty:new x(e<0?[0,-e,0]:[0,0,e])}}x.empty=new x([]);class z{constructor(e=[],t,r=0,n=e.length){this.maps=e,this.mirror=t,this.from=r,this.to=n}slice(e=0,t=this.maps.length){return new z(this.maps,this.mirror,e,t)}copy(){return new z(this.maps.slice(),this.mirror&&this.mirror.slice(),this.from,this.to)}appendMap(e,t){this.to=this.maps.push(e),t!=null&&this.setMirror(this.maps.length-1,t)}appendMapping(e){for(let t=0,r=this.maps.length;t<e.maps.length;t++){let n=e.getMirror(t);this.appendMap(e.maps[t],n!=null&&n<t?r+n:void 0)}}getMirror(e){if(this.mirror){for(let t=0;t<this.mirror.length;t++)if(this.mirror[t]==e)return this.mirror[t+(t%2?-1:1)]}}setMirror(e,t){this.mirror||(this.mirror=[]),this.mirror.push(e,t)}appendMappingInverted(e){for(let t=e.maps.length-1,r=this.maps.length+e.maps.length;t>=0;t--){let n=e.getMirror(t);this.appendMap(e.maps[t].invert(),n!=null&&n>t?r-n-1:void 0)}}invert(){let e=new z;return e.appendMappingInverted(this),e}map(e,t=1){if(this.mirror)return this._map(e,t,!0);for(let r=this.from;r<this.to;r++)e=this.maps[r].map(e,t);return e}mapResult(e,t=1){return this._map(e,t,!1)}_map(e,t,r){let n=0;for(let i=this.from;i<this.to;i++){let o=this.maps[i],l=o.mapResult(e,t);if(l.recover!=null){let a=this.getMirror(i);if(a!=null&&a>i&&a<this.to){i=a,e=this.maps[a].recover(l.recover);continue}}n|=l.delInfo,e=l.pos}return r?e:new L(e,n,null)}}const B=Object.create(null);class v{getMap(){return x.empty}merge(e){return null}static fromJSON(e,t){if(!t||!t.stepType)throw new RangeError("Invalid input for Step.fromJSON");let r=B[t.stepType];if(!r)throw new RangeError(`No step type ${t.stepType} defined`);return r.fromJSON(e,t)}static jsonID(e,t){if(e in B)throw new RangeError("Duplicate use of step JSON ID "+e);return B[e]=t,t.prototype.jsonID=e,t}}class y{constructor(e,t){this.doc=e,this.failed=t}static ok(e){return new y(e,null)}static fail(e){return new y(null,e)}static fromReplace(e,t,r,n){try{return y.ok(e.replace(t,r,n))}catch(i){if(i instanceof ne)return y.fail(i.message);throw i}}}function P(s,e,t){let r=[];for(let n=0;n<s.childCount;n++){let i=s.child(n);i.content.size&&(i=i.copy(P(i.content,e,i))),i.isInline&&(i=e(i,t,n)),r.push(i)}return g.fromArray(r)}class C extends v{constructor(e,t,r){super(),this.from=e,this.to=t,this.mark=r}apply(e){let t=e.slice(this.from,this.to),r=e.resolve(this.from),n=r.node(r.sharedDepth(this.to)),i=new w(P(t.content,(o,l)=>!o.isAtom||!l.type.allowsMarkType(this.mark.type)?o:o.mark(this.mark.addToSet(o.marks)),n),t.openStart,t.openEnd);return y.fromReplace(e,this.from,this.to,i)}invert(){return new M(this.from,this.to,this.mark)}map(e){let t=e.mapResult(this.from,1),r=e.mapResult(this.to,-1);return t.deleted&&r.deleted||t.pos>=r.pos?null:new C(t.pos,r.pos,this.mark)}merge(e){return e instanceof C&&e.mark.eq(this.mark)&&this.from<=e.to&&this.to>=e.from?new C(Math.min(this.from,e.from),Math.max(this.to,e.to),this.mark):null}toJSON(){return{stepType:"addMark",mark:this.mark.toJSON(),from:this.from,to:this.to}}static fromJSON(e,t){if(typeof t.from!="number"||typeof t.to!="number")throw new RangeError("Invalid input for AddMarkStep.fromJSON");return new C(t.from,t.to,e.markFromJSON(t.mark))}}v.jsonID("addMark",C);class M extends v{constructor(e,t,r){super(),this.from=e,this.to=t,this.mark=r}apply(e){let t=e.slice(this.from,this.to),r=new w(P(t.content,n=>n.mark(this.mark.removeFromSet(n.marks)),e),t.openStart,t.openEnd);return y.fromReplace(e,this.from,this.to,r)}invert(){return new C(this.from,this.to,this.mark)}map(e){let t=e.mapResult(this.from,1),r=e.mapResult(this.to,-1);return t.deleted&&r.deleted||t.pos>=r.pos?null:new M(t.pos,r.pos,this.mark)}merge(e){return e instanceof M&&e.mark.eq(this.mark)&&this.from<=e.to&&this.to>=e.from?new M(Math.min(this.from,e.from),Math.max(this.to,e.to),this.mark):null}toJSON(){return{stepType:"removeMark",mark:this.mark.toJSON(),from:this.from,to:this.to}}static fromJSON(e,t){if(typeof t.from!="number"||typeof t.to!="number")throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");return new M(t.from,t.to,e.markFromJSON(t.mark))}}v.jsonID("removeMark",M);class I extends v{constructor(e,t){super(),this.pos=e,this.mark=t}apply(e){let t=e.nodeAt(this.pos);if(!t)return y.fail("No node at mark step's position");let r=t.type.create(t.attrs,null,this.mark.addToSet(t.marks));return y.fromReplace(e,this.pos,this.pos+1,new w(g.from(r),0,t.isLeaf?0:1))}invert(e){let t=e.nodeAt(this.pos);if(t){let r=this.mark.addToSet(t.marks);if(r.length==t.marks.length){for(let n=0;n<t.marks.length;n++)if(!t.marks[n].isInSet(r))return new I(this.pos,t.marks[n]);return new I(this.pos,this.mark)}}return new E(this.pos,this.mark)}map(e){let t=e.mapResult(this.pos,1);return t.deletedAfter?null:new I(t.pos,this.mark)}toJSON(){return{stepType:"addNodeMark",pos:this.pos,mark:this.mark.toJSON()}}static fromJSON(e,t){if(typeof t.pos!="number")throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");return new I(t.pos,e.markFromJSON(t.mark))}}v.jsonID("addNodeMark",I);class E extends v{constructor(e,t){super(),this.pos=e,this.mark=t}apply(e){let t=e.nodeAt(this.pos);if(!t)return y.fail("No node at mark step's position");let r=t.type.create(t.attrs,null,this.mark.removeFromSet(t.marks));return y.fromReplace(e,this.pos,this.pos+1,new w(g.from(r),0,t.isLeaf?0:1))}invert(e){let t=e.nodeAt(this.pos);return!t||!this.mark.isInSet(t.marks)?this:new I(this.pos,this.mark)}map(e){let t=e.mapResult(this.pos,1);return t.deletedAfter?null:new E(t.pos,this.mark)}toJSON(){return{stepType:"removeNodeMark",pos:this.pos,mark:this.mark.toJSON()}}static fromJSON(e,t){if(typeof t.pos!="number")throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");return new E(t.pos,e.markFromJSON(t.mark))}}v.jsonID("removeNodeMark",E);class k extends v{constructor(e,t,r,n=!1){super(),this.from=e,this.to=t,this.slice=r,this.structure=n}apply(e){return this.structure&&q(e,this.from,this.to)?y.fail("Structure replace would overwrite content"):y.fromReplace(e,this.from,this.to,this.slice)}getMap(){return new x([this.from,this.to-this.from,this.slice.size])}invert(e){return new k(this.from,this.from+this.slice.size,e.slice(this.from,this.to))}map(e){let t=e.mapResult(this.from,1),r=e.mapResult(this.to,-1);return t.deletedAcross&&r.deletedAcross?null:new k(t.pos,Math.max(t.pos,r.pos),this.slice)}merge(e){if(!(e instanceof k)||e.structure||this.structure)return null;if(this.from+this.slice.size==e.from&&!this.slice.openEnd&&!e.slice.openStart){let t=this.slice.size+e.slice.size==0?w.empty:new w(this.slice.content.append(e.slice.content),this.slice.openStart,e.slice.openEnd);return new k(this.from,this.to+(e.to-e.from),t,this.structure)}else if(e.to==this.from&&!this.slice.openStart&&!e.slice.openEnd){let t=this.slice.size+e.slice.size==0?w.empty:new w(e.slice.content.append(this.slice.content),e.slice.openStart,this.slice.openEnd);return new k(e.from,this.to,t,this.structure)}else return null}toJSON(){let e={stepType:"replace",from:this.from,to:this.to};return this.slice.size&&(e.slice=this.slice.toJSON()),this.structure&&(e.structure=!0),e}static fromJSON(e,t){if(typeof t.from!="number"||typeof t.to!="number")throw new RangeError("Invalid input for ReplaceStep.fromJSON");return new k(t.from,t.to,w.fromJSON(e,t.slice),!!t.structure)}}v.jsonID("replace",k);class b extends v{constructor(e,t,r,n,i,o,l=!1){super(),this.from=e,this.to=t,this.gapFrom=r,this.gapTo=n,this.slice=i,this.insert=o,this.structure=l}apply(e){if(this.structure&&(q(e,this.from,this.gapFrom)||q(e,this.gapTo,this.to)))return y.fail("Structure gap-replace would overwrite content");let t=e.slice(this.gapFrom,this.gapTo);if(t.openStart||t.openEnd)return y.fail("Gap is not a flat range");let r=this.slice.insertAt(this.insert,t.content);return r?y.fromReplace(e,this.from,this.to,r):y.fail("Content does not fit in gap")}getMap(){return new x([this.from,this.gapFrom-this.from,this.insert,this.gapTo,this.to-this.gapTo,this.slice.size-this.insert])}invert(e){let t=this.gapTo-this.gapFrom;return new b(this.from,this.from+this.slice.size+t,this.from+this.insert,this.from+this.insert+t,e.slice(this.from,this.to).removeBetween(this.gapFrom-this.from,this.gapTo-this.from),this.gapFrom-this.from,this.structure)}map(e){let t=e.mapResult(this.from,1),r=e.mapResult(this.to,-1),n=e.map(this.gapFrom,-1),i=e.map(this.gapTo,1);return t.deletedAcross&&r.deletedAcross||n<t.pos||i>r.pos?null:new b(t.pos,r.pos,n,i,this.slice,this.insert,this.structure)}toJSON(){let e={stepType:"replaceAround",from:this.from,to:this.to,gapFrom:this.gapFrom,gapTo:this.gapTo,insert:this.insert};return this.slice.size&&(e.slice=this.slice.toJSON()),this.structure&&(e.structure=!0),e}static fromJSON(e,t){if(typeof t.from!="number"||typeof t.to!="number"||typeof t.gapFrom!="number"||typeof t.gapTo!="number"||typeof t.insert!="number")throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");return new b(t.from,t.to,t.gapFrom,t.gapTo,w.fromJSON(e,t.slice),t.insert,!!t.structure)}}v.jsonID("replaceAround",b);function q(s,e,t){let r=s.resolve(e),n=t-e,i=r.depth;for(;n>0&&i>0&&r.indexAfter(i)==r.node(i).childCount;)i--,n--;if(n>0){let o=r.node(i).maybeChild(r.indexAfter(i));for(;n>0;){if(!o||o.isLeaf)return!0;o=o.firstChild,n--}}return!1}function le(s,e,t,r){let n=[],i=[],o,l;s.doc.nodesBetween(e,t,(a,h,p)=>{if(!a.isInline)return;let f=a.marks;if(!r.isInSet(f)&&p.type.allowsMarkType(r.type)){let c=Math.max(h,e),d=Math.min(h+a.nodeSize,t),u=r.addToSet(f);for(let m=0;m<f.length;m++)f[m].isInSet(u)||(o&&o.to==c&&o.mark.eq(f[m])?o.to=d:n.push(o=new M(c,d,f[m])));l&&l.to==c?l.to=d:i.push(l=new C(c,d,r))}}),n.forEach(a=>s.step(a)),i.forEach(a=>s.step(a))}function ae(s,e,t,r){let n=[],i=0;s.doc.nodesBetween(e,t,(o,l)=>{if(!o.isInline)return;i++;let a=null;if(r instanceof ie){let h=o.marks,p;for(;p=r.isInSet(h);)(a||(a=[])).push(p),h=p.removeFromSet(h)}else r?r.isInSet(o.marks)&&(a=[r]):a=o.marks;if(a&&a.length){let h=Math.min(l+o.nodeSize,t);for(let p=0;p<a.length;p++){let f=a[p],c;for(let d=0;d<n.length;d++){let u=n[d];u.step==i-1&&f.eq(n[d].style)&&(c=u)}c?(c.to=h,c.step=i):n.push({style:f,from:Math.max(l,e),to:h,step:i})}}}),n.forEach(o=>s.step(new M(o.from,o.to,o.style)))}function he(s,e,t,r=t.contentMatch){let n=s.doc.nodeAt(e),i=[],o=e+1;for(let l=0;l<n.childCount;l++){let a=n.child(l),h=o+a.nodeSize,p=r.matchType(a.type);if(!p)i.push(new k(o,h,w.empty));else{r=p;for(let f=0;f<a.marks.length;f++)t.allowsMarkType(a.marks[f].type)||s.step(new M(o,h,a.marks[f]));if(a.isText&&!t.spec.code){let f,c=/\r?\n|\r/g,d;for(;f=c.exec(a.text);)d||(d=new w(g.from(t.schema.text(" ",t.allowedMarks(a.marks))),0,0)),i.push(new k(o+f.index,o+f.index+f[0].length,d))}}o=h}if(!r.validEnd){let l=r.fillBefore(g.empty,!0);s.replace(o,o,new w(l,0,0))}for(let l=i.length-1;l>=0;l--)s.step(i[l])}function pe(s,e,t){return(e==0||s.canReplace(e,s.childCount))&&(t==s.childCount||s.canReplace(0,t))}function Ee(s){let t=s.parent.content.cutByIndex(s.startIndex,s.endIndex);for(let r=s.depth;;--r){let n=s.$from.node(r),i=s.$from.index(r),o=s.$to.indexAfter(r);if(r<s.depth&&n.canReplace(i,o,t))return r;if(r==0||n.type.spec.isolating||!pe(n,i,o))break}return null}function fe(s,e,t){let{$from:r,$to:n,depth:i}=e,o=r.before(i+1),l=n.after(i+1),a=o,h=l,p=g.empty,f=0;for(let u=i,m=!1;u>t;u--)m||r.index(u)>0?(m=!0,p=g.from(r.node(u).copy(p)),f++):a--;let c=g.empty,d=0;for(let u=i,m=!1;u>t;u--)m||n.after(u+1)<n.end(u)?(m=!0,c=g.from(n.node(u).copy(c)),d++):h++;s.step(new b(a,h,o,l,new w(p.append(c),f,d),p.size-f,!0))}function Te(s,e,t=null,r=s){let n=de(s,e),i=n&&ce(r,e);return i?n.map(H).concat({type:e,attrs:t}).concat(i.map(H)):null}function H(s){return{type:s,attrs:null}}function de(s,e){let{parent:t,startIndex:r,endIndex:n}=s,i=t.contentMatchAt(r).findWrapping(e);if(!i)return null;let o=i.length?i[0]:e;return t.canReplaceWith(r,n,o)?i:null}function ce(s,e){let{parent:t,startIndex:r,endIndex:n}=s,i=t.child(r),o=e.contentMatch.findWrapping(i.type);if(!o)return null;let a=(o.length?o[o.length-1]:e).contentMatch;for(let h=r;a&&h<n;h++)a=a.matchType(t.child(h).type);return!a||!a.validEnd?null:o}function ue(s,e,t){let r=g.empty;for(let o=t.length-1;o>=0;o--){if(r.size){let l=t[o].type.contentMatch.matchFragment(r);if(!l||!l.validEnd)throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper")}r=g.from(t[o].type.create(t[o].attrs,r))}let n=e.start,i=e.end;s.step(new b(n,i,n,i,new w(r,0,0),t.length,!0))}function me(s,e,t,r,n){if(!r.isTextblock)throw new RangeError("Type given to setBlockType should be a textblock");let i=s.steps.length;s.doc.nodesBetween(e,t,(o,l)=>{if(o.isTextblock&&!o.hasMarkup(r,n)&&we(s.doc,s.mapping.slice(i).map(l),r)){s.clearIncompatible(s.mapping.slice(i).map(l,1),r);let a=s.mapping.slice(i),h=a.map(l,1),p=a.map(l+o.nodeSize,1);return s.step(new b(h,p,h+1,p-1,new w(g.from(r.create(n,null,o.marks)),0,0),1,!0)),!1}})}function we(s,e,t){let r=s.resolve(e),n=r.index();return r.parent.canReplaceWith(n,n+1,t)}function ge(s,e,t,r,n){let i=s.doc.nodeAt(e);if(!i)throw new RangeError("No node at given position");t||(t=i.type);let o=t.create(r,null,n||i.marks);if(i.isLeaf)return s.replaceWith(e,e+i.nodeSize,o);if(!t.validContent(i.content))throw new RangeError("Invalid content for node type "+t.name);s.step(new b(e,e+i.nodeSize,e+1,e+i.nodeSize-1,new w(g.from(o),0,0),1,!0))}function Oe(s,e,t=1,r){let n=s.resolve(e),i=n.depth-t,o=r&&r[r.length-1]||n.parent;if(i<0||n.parent.type.spec.isolating||!n.parent.canReplace(n.index(),n.parent.childCount)||!o.type.validContent(n.parent.content.cutByIndex(n.index(),n.parent.childCount)))return!1;for(let h=n.depth-1,p=t-2;h>i;h--,p--){let f=n.node(h),c=n.index(h);if(f.type.spec.isolating)return!1;let d=f.content.cutByIndex(c,f.childCount),u=r&&r[p+1];u&&(d=d.replaceChild(0,u.type.create(u.attrs)));let m=r&&r[p]||f;if(!f.canReplace(c+1,f.childCount)||!m.type.validContent(d))return!1}let l=n.indexAfter(i),a=r&&r[0];return n.node(i).canReplaceWith(l,l,a?a.type:n.node(i+1).type)}function ye(s,e,t=1,r){let n=s.doc.resolve(e),i=g.empty,o=g.empty;for(let l=n.depth,a=n.depth-t,h=t-1;l>a;l--,h--){i=g.from(n.node(l).copy(i));let p=r&&r[h];o=g.from(p?p.type.create(p.attrs,o):n.node(l).copy(o))}s.step(new k(e,e,new w(i.append(o),t,t),!0))}function Fe(s,e){let t=s.resolve(e),r=t.index();return Y(t.nodeBefore,t.nodeAfter)&&t.parent.canReplace(r,r+1)}function Y(s,e){return!!(s&&e&&!s.isLeaf&&s.canAppend(e))}function ze(s,e,t=-1){let r=s.resolve(e);for(let n=r.depth;;n--){let i,o,l=r.index(n);if(n==r.depth?(i=r.nodeBefore,o=r.nodeAfter):t>0?(i=r.node(n+1),l++,o=r.node(n).maybeChild(l)):(i=r.node(n).maybeChild(l-1),o=r.node(n+1)),i&&!i.isTextblock&&Y(i,o)&&r.node(n).canReplace(l,l+1))return e;if(n==0)break;e=t<0?r.before(n):r.after(n)}}function ve(s,e,t){let r=new k(e-t,e+t,w.empty,!0);s.step(r)}function ke(s,e,t){let r=s.resolve(e);if(r.parent.canReplaceWith(r.index(),r.index(),t))return e;if(r.parentOffset==0)for(let n=r.depth-1;n>=0;n--){let i=r.index(n);if(r.node(n).canReplaceWith(i,i,t))return r.before(n+1);if(i>0)return null}if(r.parentOffset==r.parent.content.size)for(let n=r.depth-1;n>=0;n--){let i=r.indexAfter(n);if(r.node(n).canReplaceWith(i,i,t))return r.after(n+1);if(i<r.node(n).childCount)return null}return null}function Je(s,e,t){let r=s.resolve(e);if(!t.content.size)return e;let n=t.content;for(let i=0;i<t.openStart;i++)n=n.firstChild.content;for(let i=1;i<=(t.openStart==0&&t.size?2:1);i++)for(let o=r.depth;o>=0;o--){let l=o==r.depth?0:r.pos<=(r.start(o+1)+r.end(o+1))/2?-1:1,a=r.index(o)+(l>0?1:0),h=r.node(o),p=!1;if(i==1)p=h.canReplace(a,a,n);else{let f=h.contentMatchAt(a).findWrapping(n.firstChild.type);p=f&&h.canReplaceWith(a,a,f[0])}if(p)return l==0?r.pos:l<0?r.before(o+1):r.after(o+1)}return null}function Se(s,e,t=e,r=w.empty){if(e==t&&!r.size)return null;let n=s.resolve(e),i=s.resolve(t);return Z(n,i,r)?new k(e,t,r):new xe(n,i,r).fit()}function Z(s,e,t){return!t.openStart&&!t.openEnd&&s.start()==e.start()&&s.parent.canReplace(s.index(),e.index(),t.content)}class xe{constructor(e,t,r){this.$from=e,this.$to=t,this.unplaced=r,this.frontier=[],this.placed=g.empty;for(let n=0;n<=e.depth;n++){let i=e.node(n);this.frontier.push({type:i.type,match:i.contentMatchAt(e.indexAfter(n))})}for(let n=e.depth;n>0;n--)this.placed=g.from(e.node(n).copy(this.placed))}get depth(){return this.frontier.length-1}fit(){for(;this.unplaced.size;){let h=this.findFittable();h?this.placeNodes(h):this.openMore()||this.dropNode()}let e=this.mustMoveInline(),t=this.placed.size-this.depth-this.$from.depth,r=this.$from,n=this.close(e<0?this.$to:r.doc.resolve(e));if(!n)return null;let i=this.placed,o=r.depth,l=n.depth;for(;o&&l&&i.childCount==1;)i=i.firstChild.content,o--,l--;let a=new w(i,o,l);return e>-1?new b(r.pos,e,this.$to.pos,this.$to.end(),a,t):a.size||r.pos!=this.$to.pos?new k(r.pos,n.pos,a):null}findFittable(){let e=this.unplaced.openStart;for(let t=this.unplaced.content,r=0,n=this.unplaced.openEnd;r<e;r++){let i=t.firstChild;if(t.childCount>1&&(n=0),i.type.spec.isolating&&n<=r){e=r;break}t=i.content}for(let t=1;t<=2;t++)for(let r=t==1?e:this.unplaced.openStart;r>=0;r--){let n,i=null;r?(i=W(this.unplaced.content,r-1).firstChild,n=i.content):n=this.unplaced.content;let o=n.firstChild;for(let l=this.depth;l>=0;l--){let{type:a,match:h}=this.frontier[l],p,f=null;if(t==1&&(o?h.matchType(o.type)||(f=h.fillBefore(g.from(o),!1)):i&&a.compatibleContent(i.type)))return{sliceDepth:r,frontierDepth:l,parent:i,inject:f};if(t==2&&o&&(p=h.findWrapping(o.type)))return{sliceDepth:r,frontierDepth:l,parent:i,wrap:p};if(i&&h.matchType(i.type))break}}}openMore(){let{content:e,openStart:t,openEnd:r}=this.unplaced,n=W(e,t);return!n.childCount||n.firstChild.isLeaf?!1:(this.unplaced=new w(e,t+1,Math.max(r,n.size+t>=e.size-r?t+1:0)),!0)}dropNode(){let{content:e,openStart:t,openEnd:r}=this.unplaced,n=W(e,t);if(n.childCount<=1&&t>0){let i=e.size-t<=t+n.size;this.unplaced=new w(O(e,t-1,1),t-1,i?t-1:r)}else this.unplaced=new w(O(e,t,1),t,r)}placeNodes({sliceDepth:e,frontierDepth:t,parent:r,inject:n,wrap:i}){for(;this.depth>t;)this.closeFrontierNode();if(i)for(let m=0;m<i.length;m++)this.openFrontierNode(i[m]);let o=this.unplaced,l=r?r.content:o.content,a=o.openStart-e,h=0,p=[],{match:f,type:c}=this.frontier[t];if(n){for(let m=0;m<n.childCount;m++)p.push(n.child(m));f=f.matchFragment(n)}let d=l.size+e-(o.content.size-o.openEnd);for(;h<l.childCount;){let m=l.child(h),S=f.matchType(m.type);if(!S)break;h++,(h>1||a==0||m.content.size)&&(f=S,p.push(j(m.mark(c.allowedMarks(m.marks)),h==1?a:0,h==l.childCount?d:-1)))}let u=h==l.childCount;u||(d=-1),this.placed=F(this.placed,t,g.from(p)),this.frontier[t].match=f,u&&d<0&&r&&r.type==this.frontier[this.depth].type&&this.frontier.length>1&&this.closeFrontierNode();for(let m=0,S=l;m<d;m++){let N=S.lastChild;this.frontier.push({type:N.type,match:N.contentMatchAt(N.childCount)}),S=N.content}this.unplaced=u?e==0?w.empty:new w(O(o.content,e-1,1),e-1,d<0?o.openEnd:e-1):new w(O(o.content,e,h),o.openStart,o.openEnd)}mustMoveInline(){if(!this.$to.parent.isTextblock)return-1;let e=this.frontier[this.depth],t;if(!e.type.isTextblock||!D(this.$to,this.$to.depth,e.type,e.match,!1)||this.$to.depth==this.depth&&(t=this.findCloseLevel(this.$to))&&t.depth==this.depth)return-1;let{depth:r}=this.$to,n=this.$to.after(r);for(;r>1&&n==this.$to.end(--r);)++n;return n}findCloseLevel(e){e:for(let t=Math.min(this.depth,e.depth);t>=0;t--){let{match:r,type:n}=this.frontier[t],i=t<e.depth&&e.end(t+1)==e.pos+(e.depth-(t+1)),o=D(e,t,n,r,i);if(o){for(let l=t-1;l>=0;l--){let{match:a,type:h}=this.frontier[l],p=D(e,l,h,a,!0);if(!p||p.childCount)continue e}return{depth:t,fit:o,move:i?e.doc.resolve(e.after(t+1)):e}}}}close(e){let t=this.findCloseLevel(e);if(!t)return null;for(;this.depth>t.depth;)this.closeFrontierNode();t.fit.childCount&&(this.placed=F(this.placed,t.depth,t.fit)),e=t.move;for(let r=t.depth+1;r<=e.depth;r++){let n=e.node(r),i=n.type.contentMatch.fillBefore(n.content,!0,e.index(r));this.openFrontierNode(n.type,n.attrs,i)}return e}openFrontierNode(e,t=null,r){let n=this.frontier[this.depth];n.match=n.match.matchType(e),this.placed=F(this.placed,this.depth,g.from(e.create(t,r))),this.frontier.push({type:e,match:e.contentMatch})}closeFrontierNode(){let t=this.frontier.pop().match.fillBefore(g.empty,!0);t.childCount&&(this.placed=F(this.placed,this.frontier.length,t))}}function O(s,e,t){return e==0?s.cutByIndex(t,s.childCount):s.replaceChild(0,s.firstChild.copy(O(s.firstChild.content,e-1,t)))}function F(s,e,t){return e==0?s.append(t):s.replaceChild(s.childCount-1,s.lastChild.copy(F(s.lastChild.content,e-1,t)))}function W(s,e){for(let t=0;t<e;t++)s=s.firstChild.content;return s}function j(s,e,t){if(e<=0)return s;let r=s.content;return e>1&&(r=r.replaceChild(0,j(r.firstChild,e-1,r.childCount==1?t-1:0))),e>0&&(r=s.type.contentMatch.fillBefore(r).append(r),t<=0&&(r=r.append(s.type.contentMatch.matchFragment(r).fillBefore(g.empty,!0)))),s.copy(r)}function D(s,e,t,r,n){let i=s.node(e),o=n?s.indexAfter(e):s.index(e);if(o==i.childCount&&!t.compatibleContent(i.type))return null;let l=r.fillBefore(i.content,!0,o);return l&&!Me(t,i.content,o)?l:null}function Me(s,e,t){for(let r=t;r<e.childCount;r++)if(!s.allowsMarks(e.child(r).marks))return!0;return!1}function be(s){return s.spec.defining||s.spec.definingForContent}function Ce(s,e,t,r){if(!r.size)return s.deleteRange(e,t);let n=s.doc.resolve(e),i=s.doc.resolve(t);if(Z(n,i,r))return s.step(new k(e,t,r));let o=ee(n,s.doc.resolve(t));o[o.length-1]==0&&o.pop();let l=-(n.depth+1);o.unshift(l);for(let c=n.depth,d=n.pos-1;c>0;c--,d--){let u=n.node(c).type.spec;if(u.defining||u.definingAsContext||u.isolating)break;o.indexOf(c)>-1?l=c:n.before(c)==d&&o.splice(1,0,-c)}let a=o.indexOf(l),h=[],p=r.openStart;for(let c=r.content,d=0;;d++){let u=c.firstChild;if(h.push(u),d==r.openStart)break;c=u.content}for(let c=p-1;c>=0;c--){let d=h[c],u=be(d.type);if(u&&!d.sameMarkup(n.node(Math.abs(l)-1)))p=c;else if(u||!d.type.isTextblock)break}for(let c=r.openStart;c>=0;c--){let d=(c+p+1)%(r.openStart+1),u=h[d];if(u)for(let m=0;m<o.length;m++){let S=o[(m+a)%o.length],N=!0;S<0&&(N=!1,S=-S);let te=n.node(S-1),G=n.index(S-1);if(te.canReplaceWith(G,G,u.type,u.marks))return s.replace(n.before(S),N?i.after(S):t,new w(_(r.content,0,r.openStart,d),d,r.openEnd))}}let f=s.steps.length;for(let c=o.length-1;c>=0&&(s.replace(e,t,r),!(s.steps.length>f));c--){let d=o[c];d<0||(e=n.before(d),t=i.after(d))}}function _(s,e,t,r,n){if(e<t){let i=s.firstChild;s=s.replaceChild(0,i.copy(_(i.content,e+1,t,r,i)))}if(e>r){let i=n.contentMatchAt(0),o=i.fillBefore(s).append(s);s=o.append(i.matchFragment(o).fillBefore(g.empty,!0))}return s}function Ie(s,e,t,r){if(!r.isInline&&e==t&&s.doc.resolve(e).parent.content.size){let n=ke(s.doc,e,r.type);n!=null&&(e=t=n)}s.replaceRange(e,t,new w(g.from(r),0,0))}function Ne(s,e,t){let r=s.doc.resolve(e),n=s.doc.resolve(t),i=ee(r,n);for(let o=0;o<i.length;o++){let l=i[o],a=o==i.length-1;if(a&&l==0||r.node(l).type.contentMatch.validEnd)return s.delete(r.start(l),n.end(l));if(l>0&&(a||r.node(l-1).canReplace(r.index(l-1),n.indexAfter(l-1))))return s.delete(r.before(l),n.after(l))}for(let o=1;o<=r.depth&&o<=n.depth;o++)if(e-r.start(o)==r.depth-o&&t>r.end(o)&&n.end(o)-t!=n.depth-o)return s.delete(r.before(o),t);s.delete(e,t)}function ee(s,e){let t=[],r=Math.min(s.depth,e.depth);for(let n=r;n>=0;n--){let i=s.start(n);if(i<s.pos-(s.depth-n)||e.end(n)>e.pos+(e.depth-n)||s.node(n).type.spec.isolating||e.node(n).type.spec.isolating)break;(i==e.start(n)||n==s.depth&&n==e.depth&&s.parent.inlineContent&&e.parent.inlineContent&&n&&e.start(n-1)==i-1)&&t.push(n)}return t}class R extends v{constructor(e,t,r){super(),this.pos=e,this.attr=t,this.value=r}apply(e){let t=e.nodeAt(this.pos);if(!t)return y.fail("No node at attribute step's position");let r=Object.create(null);for(let i in t.attrs)r[i]=t.attrs[i];r[this.attr]=this.value;let n=t.type.create(r,null,t.marks);return y.fromReplace(e,this.pos,this.pos+1,new w(g.from(n),0,t.isLeaf?0:1))}getMap(){return x.empty}invert(e){return new R(this.pos,this.attr,e.nodeAt(this.pos).attrs[this.attr])}map(e){let t=e.mapResult(this.pos,1);return t.deletedAfter?null:new R(t.pos,this.attr,this.value)}toJSON(){return{stepType:"attr",pos:this.pos,attr:this.attr,value:this.value}}static fromJSON(e,t){if(typeof t.pos!="number"||typeof t.attr!="string")throw new RangeError("Invalid input for AttrStep.fromJSON");return new R(t.pos,t.attr,t.value)}}v.jsonID("attr",R);class J extends v{constructor(e,t){super(),this.attr=e,this.value=t}apply(e){let t=Object.create(null);for(let n in e.attrs)t[n]=e.attrs[n];t[this.attr]=this.value;let r=e.type.create(t,e.content,e.marks);return y.ok(r)}getMap(){return x.empty}invert(e){return new J(this.attr,e.attrs[this.attr])}map(e){return this}toJSON(){return{stepType:"docAttr",attr:this.attr,value:this.value}}static fromJSON(e,t){if(typeof t.attr!="string")throw new RangeError("Invalid input for DocAttrStep.fromJSON");return new J(t.attr,t.value)}}v.jsonID("docAttr",J);let T=class extends Error{};T=function s(e){let t=Error.call(this,e);return t.__proto__=s.prototype,t};T.prototype=Object.create(Error.prototype);T.prototype.constructor=T;T.prototype.name="TransformError";class Ae{constructor(e){this.doc=e,this.steps=[],this.docs=[],this.mapping=new z}get before(){return this.docs.length?this.docs[0]:this.doc}step(e){let t=this.maybeStep(e);if(t.failed)throw new T(t.failed);return this}maybeStep(e){let t=e.apply(this.doc);return t.failed||this.addStep(e,t.doc),t}get docChanged(){return this.steps.length>0}addStep(e,t){this.docs.push(this.doc),this.steps.push(e),this.mapping.appendMap(e.getMap()),this.doc=t}replace(e,t=e,r=w.empty){let n=Se(this.doc,e,t,r);return n&&this.step(n),this}replaceWith(e,t,r){return this.replace(e,t,new w(g.from(r),0,0))}delete(e,t){return this.replace(e,t,w.empty)}insert(e,t){return this.replaceWith(e,e,t)}replaceRange(e,t,r){return Ce(this,e,t,r),this}replaceRangeWith(e,t,r){return Ie(this,e,t,r),this}deleteRange(e,t){return Ne(this,e,t),this}lift(e,t){return fe(this,e,t),this}join(e,t=1){return ve(this,e,t),this}wrap(e,t){return ue(this,e,t),this}setBlockType(e,t=e,r,n=null){return me(this,e,t,r,n),this}setNodeMarkup(e,t,r=null,n){return ge(this,e,t,r,n),this}setNodeAttribute(e,t,r){return this.step(new R(e,t,r)),this}setDocAttribute(e,t){return this.step(new J(e,t)),this}addNodeMark(e,t){return this.step(new I(e,t)),this}removeNodeMark(e,t){if(!(t instanceof re)){let r=this.doc.nodeAt(e);if(!r)throw new RangeError("No node at position "+e);if(t=t.isInSet(r.marks),!t)return this}return this.step(new E(e,t)),this}split(e,t=1,r){return ye(this,e,t,r),this}addMark(e,t,r){return le(this,e,t,r),this}removeMark(e,t,r){return ae(this,e,t,r),this}clearIncompatible(e,t,r){return he(this,e,t,r),this}}export{z as M,k as R,Ae as T,Oe as a,b,Fe as c,Je as d,Te as f,ze as j,Ee as l,Se as r};
