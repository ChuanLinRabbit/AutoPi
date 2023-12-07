import e from"qs";function t(e,t,i="/"){let r=t?.split(i);r.shift();let n=e;for(;r.length>0;){if("object"!=typeof n)return n;let e=r.shift();n=e.includes("__")?n[e.replace("__","")]:n[e]}return n}class i{constructor(e,t,i,r){this.API=r,this.url=e,this.data=t,this.tempConfig=i,this.openApiConfig=null,this.currentService={},this.apiConfig={url:null,method:null,headers:null,data:{},params:{}},this.warnRequiredParams=[],this.warnTypeParams=[]}init(){this.getOpenApiConfig(),this.verifyOpenApiConfig(),this.initApiBaseConfig();try{this.initApiData()}catch(e){console.error(e),console.error({url:this.url,data:this.data}),this.apiConfig.data=this.data}this.readTempConfig()}getOpenApiConfig(){let{url:e}=this;for(let t of this.API)if(t.paths[e]){this.openApiConfig=t.paths[e],this.currentService=t;break}}verifyOpenApiConfig(){let{url:e,openApiConfig:t,tempConfig:i}=this;if(!t)throw Error(`API "${e}" NOT FOUND`);if(Object.keys(t).length>1&&!i?.method)throw Error(`API "${e}" has multiple method, you must set method for this api`)}initApiBaseConfig(){let{url:e,apiConfig:t,currentService:i,data:r,tempConfig:n,openApiConfig:s}=this;for(i.basePath&&"/"!==i.basePath?t.url=i.basePath+e:t.url=e;/(\{\w+\})/.test(t.url);)t.url=t.url.replace(RegExp.$1,r[RegExp.$1.substring(1,RegExp.$1.length-1)]);t.method=Object.keys(s)[0],n&&n.method&&(t.method=n.method),t.headers={"Content-Type":"application/json;charset=utf-8"}}initApiData(){let i=this.openApiConfig[this.apiConfig.method].parameters,n=this.openApiConfig[this.apiConfig.method].requestBody;if("[object Array]"===Object.prototype.toString.call(this.data))return this.apiConfig.data=this.data;if(i&&(this.apiConfig.data=function(i,n={},s){let a={};for(let o of i){if(!(n&&null!==n[o.name]&&void 0!==n[o.name]||n&&null!==n[o.name]&&void 0!==n[o.name]||o?.schema?.$ref)){o.required&&s.warnRequiredParams.push(o);continue}if(o.schema){let e=null;o.schema.$ref?(e=t(s.currentService,o.schema.$ref),a[o.name]=r(e,n,s)):(e=o.schema,a[o.name]=r(e,n[o.name],s))}else a[o.name]=r(o,n[o.name],s);if(o.schema)if(o.schema.type&&"array"===o.schema.type){if("[object Array]"===Object.prototype.toString.call(n))return n;a=a[o.name||"_Array"]}else o.schema.$ref&&(Object.assign(a,a[o.name]),delete a[o.name]);null===a[o.name]&&delete a[o.name],"path"===o.in&&delete a[o.name];let i=null;if("query"!==o.in||!a[o.name]&&0!==a[o.name]||(i||(i={}),i[o.name]=a[o.name],delete a[o.name]),i){if(!e.stringify(i))continue;s.apiConfig.url.includes("?")?s.apiConfig.url+=`&${e.stringify(i)}`:s.apiConfig.url+=`?${e.stringify(i)}`}}return a}(i,this.data,this)),n){let e=n.content["application/json"]?.schema?.$ref||n.content["*/*"]?.schema?.$ref;if(e){let i=t(this.currentService,e);this.apiConfig.data=r(i,this.data,this)}else this.apiConfig.data=this.data}this.printVerifyParameters()}printVerifyParameters(){let{url:e,data:t,warnRequiredParams:i,warnTypeParams:r}=this;if(i?.length){let t=i.map((e=>e.description)),r=i.map((e=>e.name));return console.error(`API "${e}" 中，必填项【${t.toString()}】未填写`),console.error(`API "${e}" parameters must contain "${r.toString()}"`),`必填项【${t.toString()}】未填写`}if(r?.length)for(let t of r)console.error(`API "${e}" parameter "${t.name}" is not ${t.type}`);(i?.length||r?.length)&&(console.error(`API "${e}" parameters is not support`),console.error("your data is",t))}readTempConfig=function(){let{tempConfig:e,apiConfig:t}=this;e&&(e.headers&&(e.headers=Object.assign(t.headers,e.headers)),Object.assign(t,e))}}function r(e,i={},n){if(!i&&0!==i&&""!==i&&!1!==i)return null;let s=null;if("object"===e?.type){if(s={},e.properties)for(let a in e.properties){let o=e.properties[a],h=i[a];if(null!=h)if(o.$ref){let e=t(n.currentService,o.$ref);"[object Object]"===Object.prototype.toString.call(h)?s[a]=r(e,h,n):n.warnTypeParams.push(o)}else s[a]=r(o,h,n);else e.required&&e.required.includes(a)&&n.warnRequiredParams.push(o)}else if("object"===e.additionalProperties.type)return i}else{if("array"===e?.type)return i;if("string"===e?.type){if("string"==typeof i)return i;if("object"==typeof i)return i;if("number"==typeof i)return i.toString();n.warnTypeParams.push(e)}else{if("integer"!==e?.type)return i;if("number"==typeof i)return i;if(!i)return null;if(!isNaN(i))return Number(i);n.warnTypeParams.push(e)}}return s}class n{constructor(e,t){this.service=e,this.API=t,this.waitList=[],this.startList=[],this.log=[],this.maxCount=5,this.logLength=100}getAxiosConfig(e,t,r){let n=new i(e,t,r,this.API);return n.init(),n.apiConfig}sendAxios(e,t,i){let r=this.getAxiosConfig(e,t,i);return this.queueSend(r)}sendAll(e){let t=new Array(e.length),i=[];for(let r in e){let n=e[r],s=this.getAxiosConfig(n.url,n.data,n.tempConfig);s.noMask=!0,i.push(this.queueSend(s).then((e=>{t[r]=e})))}return new Promise((e=>{Promise.all(i).finally((()=>{e(t)}))}))}sendFile(e,t,i){let r=this.getAxiosConfig(e,t,i);return r.headers["Content-Type"]="multipart/form-data",r.data=function(e,t=!1){let i=new FormData;for(let t in e)i.append(t,e[t]);return i}(t),this.service.request(r)}queueSend(e){return e._tempId=Math.random(),this.startList.length<this.maxCount?(this.startList.push(e),new Promise(((t,i)=>{this.sendOne(e,t,i)}))):(this.waitList.push(e),new Promise(((t,i)=>{let r=setInterval((()=>{this.waitList[0]===e&&this.startList.length<5&&(clearInterval(r),this.startList.push(e),this.sendOne(e,t,i),this.waitList.splice(0,1))}),100)})))}sendOne(e,t,i){this.service.request(e).then((i=>{this.startList.splice(this.startList.findIndex((t=>t._tempId=e._tempId)),1),this.addLog(e,i),t(i)})).catch((t=>{this.startList.splice(this.startList.findIndex((t=>t._tempId=e._tempId)),1),this.addLog(e,t),i(t)}))}addLog(e,t){const i={request:e,response:t};this.log.length>this.logLength&&this.log.pop(),this.log.unshift(i)}}function s(e,t){return new n(e,t)}export{s as useAutoAxios};