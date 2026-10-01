import{a as Ut}from"./chunk-OLTUANNR.js";import{a as jt}from"./chunk-CZNVT2UW.js";import{b as Mt}from"./chunk-YOAYTP23.js";import{e as Bt,m as Vt}from"./chunk-KIEPZML3.js";import{K as G,P as Nt,Q as wt,R as $t,S as Pt,T as Ft,U as Yt,V as Gt,W as w}from"./chunk-ANDVPBLN.js";import{b as h,d as k}from"./chunk-4EKV47ZX.js";import{a as Rt}from"./chunk-HZVFQ46Q.js";Rt();var Ct=function(){var t=h(function(Y,o,c,n){for(c=c||{},n=Y.length;n--;c[Y[n]]=o);return c},"o"),e=[1,2],s=[1,3],a=[1,4],r=[2,4],u=[1,9],d=[1,11],S=[1,16],f=[1,17],T=[1,18],b=[1,19],_=[1,33],x=[1,20],v=[1,21],p=[1,22],D=[1,23],R=[1,24],L=[1,26],$=[1,27],I=[1,28],P=[1,29],st=[1,30],it=[1,31],rt=[1,32],at=[1,35],nt=[1,36],ot=[1,37],lt=[1,38],j=[1,34],y=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ct=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],Lt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Tt={trace:h(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:h(function(o,c,n,g,E,i,J){var l=i.length-1;switch(E){case 3:return g.setRootDoc(i[l]),i[l];break;case 4:this.$=[];break;case 5:i[l]!="nl"&&(i[l-1].push(i[l]),this.$=i[l-1]);break;case 6:case 7:this.$=i[l];break;case 8:this.$="nl";break;case 12:this.$=i[l];break;case 13:let ut=i[l-1];ut.description=g.trimColon(i[l]),this.$=ut;break;case 14:this.$={stmt:"relation",state1:i[l-2],state2:i[l]};break;case 15:let dt=g.trimColon(i[l]);this.$={stmt:"relation",state1:i[l-3],state2:i[l-1],description:dt};break;case 19:this.$={stmt:"state",id:i[l-3],type:"default",description:"",doc:i[l-1]};break;case 20:var V=i[l],H=i[l-2].trim();if(i[l].match(":")){var q=i[l].split(":");V=q[0],H=[H,q[1]]}this.$={stmt:"state",id:V,type:"default",description:H};break;case 21:this.$={stmt:"state",id:i[l-3],type:"default",description:i[l-5],doc:i[l-1]};break;case 22:this.$={stmt:"state",id:i[l],type:"fork"};break;case 23:this.$={stmt:"state",id:i[l],type:"join"};break;case 24:this.$={stmt:"state",id:i[l],type:"choice"};break;case 25:this.$={stmt:"state",id:g.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[l-1].trim(),note:{position:i[l-2].trim(),text:i[l].trim()}};break;case 29:this.$=i[l].trim(),g.setAccTitle(this.$);break;case 30:case 31:this.$=i[l].trim(),g.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[l-3],url:i[l-2],tooltip:i[l-1]};break;case 33:this.$={stmt:"click",id:i[l-3],url:i[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[l-1].trim(),classes:i[l].trim()};break;case 36:this.$={stmt:"style",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 37:this.$={stmt:"applyClass",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 38:g.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:g.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:g.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:g.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:a},{1:[3]},{3:5,4:e,5:s,6:a},{3:6,4:e,5:s,6:a},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],r,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:T,22:b,24:_,25:x,26:v,27:p,28:D,29:R,32:25,33:L,35:$,37:I,38:P,41:st,45:it,48:rt,51:at,52:nt,53:ot,54:lt,57:j},t(y,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:f,19:T,22:b,24:_,25:x,26:v,27:p,28:D,29:R,32:25,33:L,35:$,37:I,38:P,41:st,45:it,48:rt,51:at,52:nt,53:ot,54:lt,57:j},t(y,[2,7]),t(y,[2,8]),t(y,[2,9]),t(y,[2,10]),t(y,[2,11]),t(y,[2,12],{14:[1,40],15:[1,41]}),t(y,[2,16]),{18:[1,42]},t(y,[2,18],{20:[1,43]}),{23:[1,44]},t(y,[2,22]),t(y,[2,23]),t(y,[2,24]),t(y,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(y,[2,28]),{34:[1,49]},{36:[1,50]},t(y,[2,31]),{13:51,24:_,57:j},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(ct,[2,44],{58:[1,56]}),t(ct,[2,45],{58:[1,57]}),t(y,[2,38]),t(y,[2,39]),t(y,[2,40]),t(y,[2,41]),t(y,[2,6]),t(y,[2,13]),{13:58,24:_,57:j},t(y,[2,17]),t(Lt,r,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(y,[2,29]),t(y,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(y,[2,14],{14:[1,71]}),{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:T,21:[1,72],22:b,24:_,25:x,26:v,27:p,28:D,29:R,32:25,33:L,35:$,37:I,38:P,41:st,45:it,48:rt,51:at,52:nt,53:ot,54:lt,57:j},t(y,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(y,[2,34]),t(y,[2,35]),t(y,[2,36]),t(y,[2,37]),t(ct,[2,46]),t(ct,[2,47]),t(y,[2,15]),t(y,[2,19]),t(Lt,r,{7:78}),t(y,[2,26]),t(y,[2,27]),{5:[1,79]},{5:[1,80]},{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:T,21:[1,81],22:b,24:_,25:x,26:v,27:p,28:D,29:R,32:25,33:L,35:$,37:I,38:P,41:st,45:it,48:rt,51:at,52:nt,53:ot,54:lt,57:j},t(y,[2,32]),t(y,[2,33]),t(y,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:h(function(o,c){if(c.recoverable)this.trace(o);else{var n=new Error(o);throw n.hash=c,n}},"parseError"),parse:h(function(o){var c=this,n=[0],g=[],E=[null],i=[],J=this.table,l="",V=0,H=0,q=0,ut=2,dt=1,de=i.slice.call(arguments,1),m=Object.create(this.lexer),M={yy:{}};for(var Et in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Et)&&(M.yy[Et]=this.yy[Et]);m.setInput(o,M.yy),M.yy.lexer=m,M.yy.parser=this,typeof m.yylloc>"u"&&(m.yylloc={});var bt=m.yylloc;i.push(bt);var fe=m.options&&m.options.ranges;typeof M.yy.parseError=="function"?this.parseError=M.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function pe(O){n.length=n.length-2*O,E.length=E.length-O,i.length=i.length-O}h(pe,"popStack");function It(){var O;return O=g.pop()||m.lex()||dt,typeof O!="number"&&(O instanceof Array&&(g=O,O=g.pop()),O=c.symbols_[O]||O),O}h(It,"lex");for(var C,_t,U,N,Be,kt,W={},ft,F,Ot,pt;;){if(U=n[n.length-1],this.defaultActions[U]?N=this.defaultActions[U]:((C===null||typeof C>"u")&&(C=It()),N=J[U]&&J[U][C]),typeof N>"u"||!N.length||!N[0]){var mt="";pt=[];for(ft in J[U])this.terminals_[ft]&&ft>ut&&pt.push("'"+this.terminals_[ft]+"'");m.showPosition?mt="Parse error on line "+(V+1)+`:
`+m.showPosition()+`
Expecting `+pt.join(", ")+", got '"+(this.terminals_[C]||C)+"'":mt="Parse error on line "+(V+1)+": Unexpected "+(C==dt?"end of input":"'"+(this.terminals_[C]||C)+"'"),this.parseError(mt,{text:m.match,token:this.terminals_[C]||C,line:m.yylineno,loc:bt,expected:pt})}if(N[0]instanceof Array&&N.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+C);switch(N[0]){case 1:n.push(C),E.push(m.yytext),i.push(m.yylloc),n.push(N[1]),C=null,_t?(C=_t,_t=null):(H=m.yyleng,l=m.yytext,V=m.yylineno,bt=m.yylloc,q>0&&q--);break;case 2:if(F=this.productions_[N[1]][1],W.$=E[E.length-F],W._$={first_line:i[i.length-(F||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(F||1)].first_column,last_column:i[i.length-1].last_column},fe&&(W._$.range=[i[i.length-(F||1)].range[0],i[i.length-1].range[1]]),kt=this.performAction.apply(W,[l,H,V,M.yy,N[1],E,i].concat(de)),typeof kt<"u")return kt;F&&(n=n.slice(0,-1*F*2),E=E.slice(0,-1*F),i=i.slice(0,-1*F)),n.push(this.productions_[N[1]][0]),E.push(W.$),i.push(W._$),Ot=J[n[n.length-2]][n[n.length-1]],n.push(Ot);break;case 3:return!0}}return!0},"parse")},ue=function(){var Y={EOF:1,parseError:h(function(c,n){if(this.yy.parser)this.yy.parser.parseError(c,n);else throw new Error(c)},"parseError"),setInput:h(function(o,c){return this.yy=c||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:h(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var c=o.match(/(?:\r\n?|\n).*/g);return c?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:h(function(o){var c=o.length,n=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-c),this.offset-=c;var g=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var E=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===g.length?this.yylloc.first_column:0)+g[g.length-n.length].length-n[0].length:this.yylloc.first_column-c},this.options.ranges&&(this.yylloc.range=[E[0],E[0]+this.yyleng-c]),this.yyleng=this.yytext.length,this},"unput"),more:h(function(){return this._more=!0,this},"more"),reject:h(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:h(function(o){this.unput(this.match.slice(o))},"less"),pastInput:h(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:h(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:h(function(){var o=this.pastInput(),c=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+c+"^"},"showPosition"),test_match:h(function(o,c){var n,g,E;if(this.options.backtrack_lexer&&(E={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(E.yylloc.range=this.yylloc.range.slice(0))),g=o[0].match(/(?:\r\n?|\n).*/g),g&&(this.yylineno+=g.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:g?g[g.length-1].length-g[g.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],n=this.performAction.call(this,this.yy,this,c,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),n)return n;if(this._backtrack){for(var i in E)this[i]=E[i];return!1}return!1},"test_match"),next:h(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,c,n,g;this._more||(this.yytext="",this.match="");for(var E=this._currentRules(),i=0;i<E.length;i++)if(n=this._input.match(this.rules[E[i]]),n&&(!c||n[0].length>c[0].length)){if(c=n,g=i,this.options.backtrack_lexer){if(o=this.test_match(n,E[i]),o!==!1)return o;if(this._backtrack){c=!1;continue}else return!1}else if(!this.options.flex)break}return c?(o=this.test_match(c,E[g]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:h(function(){var c=this.next();return c||this.lex()},"lex"),begin:h(function(c){this.conditionStack.push(c)},"begin"),popState:h(function(){var c=this.conditionStack.length-1;return c>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:h(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:h(function(c){return c=this.conditionStack.length-1-Math.abs(c||0),c>=0?this.conditionStack[c]:"INITIAL"},"topState"),pushState:h(function(c){this.begin(c)},"pushState"),stateStackSize:h(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:h(function(c,n,g,E){var i=E;switch(g){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:break;case 9:break;case 10:return 5;case 11:break;case 12:break;case 13:break;case 14:break;case 15:return this.pushState("SCALE"),17;break;case 16:return 18;case 17:this.popState();break;case 18:return this.begin("acc_title"),33;break;case 19:return this.popState(),"acc_title_value";break;case 20:return this.begin("acc_descr"),35;break;case 21:return this.popState(),"acc_descr_value";break;case 22:this.begin("acc_descr_multiline");break;case 23:this.popState();break;case 24:return"acc_descr_multiline_value";case 25:return this.pushState("CLASSDEF"),41;break;case 26:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 27:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 28:return this.popState(),43;break;case 29:return this.pushState("CLASS"),48;break;case 30:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 31:return this.popState(),50;break;case 32:return this.pushState("STYLE"),45;break;case 33:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 34:return this.popState(),47;break;case 35:return this.pushState("SCALE"),17;break;case 36:return 18;case 37:this.popState();break;case 38:this.pushState("STATE");break;case 39:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;break;case 40:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;break;case 41:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;break;case 42:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;break;case 43:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;break;case 44:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;break;case 45:return 51;case 46:return 52;case 47:return 53;case 48:return 54;case 49:this.pushState("STATE_STRING");break;case 50:return this.pushState("STATE_ID"),"AS";break;case 51:return this.popState(),"ID";break;case 52:this.popState();break;case 53:return"STATE_DESCR";case 54:return 19;case 55:this.popState();break;case 56:return this.popState(),this.pushState("struct"),20;break;case 57:break;case 58:return this.popState(),21;break;case 59:break;case 60:return this.begin("NOTE"),29;break;case 61:return this.popState(),this.pushState("NOTE_ID"),59;break;case 62:return this.popState(),this.pushState("NOTE_ID"),60;break;case 63:this.popState(),this.pushState("FLOATING_NOTE");break;case 64:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 65:break;case 66:return"NOTE_TEXT";case 67:return this.popState(),"ID";break;case 68:return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 69:return this.popState(),n.yytext=n.yytext.substr(2).trim(),31;break;case 70:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),31;break;case 71:return 6;case 72:return 6;case 73:return 16;case 74:return 57;case 75:return 24;case 76:return n.yytext=n.yytext.trim(),14;break;case 77:return 15;case 78:return 28;case 79:return 58;case 80:return 5;case 81:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[12,13],inclusive:!1},struct:{rules:[12,13,25,29,32,38,45,46,47,48,57,58,59,60,74,75,76,77,78],inclusive:!1},FLOATING_NOTE_ID:{rules:[67],inclusive:!1},FLOATING_NOTE:{rules:[64,65,66],inclusive:!1},NOTE_TEXT:{rules:[69,70],inclusive:!1},NOTE_ID:{rules:[68],inclusive:!1},NOTE:{rules:[61,62,63],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[34],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[33],inclusive:!1},CLASS_STYLE:{rules:[31],inclusive:!1},CLASS:{rules:[30],inclusive:!1},CLASSDEFID:{rules:[28],inclusive:!1},CLASSDEF:{rules:[26,27],inclusive:!1},acc_descr_multiline:{rules:[23,24],inclusive:!1},acc_descr:{rules:[21],inclusive:!1},acc_title:{rules:[19],inclusive:!1},SCALE:{rules:[16,17,36,37],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[51],inclusive:!1},STATE_STRING:{rules:[52,53],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[12,13,39,40,41,42,43,44,49,50,54,55,56],inclusive:!1},ID:{rules:[12,13],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,18,20,22,25,29,32,35,38,56,60,71,72,73,74,75,76,77,79,80,81],inclusive:!0}}};return Y}();Tt.lexer=ue;function ht(){this.yy={}}return h(ht,"Parser"),ht.prototype=Tt,Tt.Parser=ht,new ht}();Ct.parser=Ct;var Ke=Ct,Se="TB",Qt="TB",Ht="dir",K="state",z="root",At="relation",ye="classDef",ge="style",Te="applyClass",tt="default",Zt="divider",te="fill:none",ee="fill: #333",se="c",ie="text",re="normal",Dt="rect",vt="rectWithTitle",Ee="stateStart",be="stateEnd",Wt="divider",zt="roundedWithTitle",_e="note",ke="noteGroup",et="statediagram",me="state",De=`${et}-${me}`,ae="transition",ve="note",Ce="note-edge",Ae=`${ae} ${Ce}`,xe=`${et}-${ve}`,Le="cluster",Ie=`${et}-${Le}`,Oe="cluster-alt",Re=`${et}-${Oe}`,ne="parent",oe="note",Ne="state",xt="----",we=`${xt}${oe}`,Kt=`${xt}${ne}`,le=h((t,e=Qt)=>{if(!t.doc)return e;let s=e;for(let a of t.doc)a.stmt==="dir"&&(s=a.value);return s},"getDir"),$e=h(function(t,e){return e.db.getClasses()},"getClasses"),Pe=h(async function(t,e,s,a){k.info("REF0:"),k.info("Drawing state diagram (v2)",e);let{securityLevel:r,state:u,layout:d}=w();a.db.extract(a.db.getRootDocV2());let S=a.db.getData(),f=Ut(e,r);S.type=a.type,S.layoutAlgorithm=d,S.nodeSpacing=u?.nodeSpacing||50,S.rankSpacing=u?.rankSpacing||50,S.markers=["barb"],S.diagramId=e,await Mt(S,f);let T=8;try{(typeof a.db.getLinks=="function"?a.db.getLinks():new Map).forEach((_,x)=>{let v=typeof x=="string"?x:typeof x?.id=="string"?x.id:"";if(!v){k.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(x));return}let p=f.node()?.querySelectorAll("g"),D;if(p?.forEach(I=>{I.textContent?.trim()===v&&(D=I)}),!D){k.warn("\u26A0\uFE0F Could not find node matching text:",v);return}let R=D.parentNode;if(!R){k.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",v);return}let L=document.createElementNS("http://www.w3.org/2000/svg","a"),$=_.url.replace(/^"+|"+$/g,"");if(L.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",$),L.setAttribute("target","_blank"),_.tooltip){let I=_.tooltip.replace(/^"+|"+$/g,"");L.setAttribute("title",I)}R.replaceChild(L,D),L.appendChild(D),k.info("\u{1F517} Wrapped node in <a> tag for:",v,_.url)})}catch(b){k.error("\u274C Error injecting clickable links:",b)}Vt.insertTitle(f,"statediagramTitleText",u?.titleTopMargin??25,a.db.getDiagramTitle()),jt(f,T,et,u?.useMaxWidth??!0)},"draw"),Xe={getClasses:$e,draw:Pe,getDir:le},yt=new Map,B=0;function gt(t="",e=0,s="",a=xt){let r=s!==null&&s.length>0?`${a}${s}`:"";return`${Ne}-${t}${r}-${e}`}h(gt,"stateDomId");var Fe=h((t,e,s,a,r,u,d,S)=>{k.trace("items",e),e.forEach(f=>{switch(f.stmt){case K:Z(t,f,s,a,r,u,d,S);break;case tt:Z(t,f,s,a,r,u,d,S);break;case At:{Z(t,f.state1,s,a,r,u,d,S),Z(t,f.state2,s,a,r,u,d,S);let T={id:"edge"+B,start:f.state1.id,end:f.state2.id,arrowhead:"normal",arrowTypeEnd:"arrow_barb",style:te,labelStyle:"",label:G.sanitizeText(f.description??"",w()),arrowheadStyle:ee,labelpos:se,labelType:ie,thickness:re,classes:ae,look:d};r.push(T),B++}break}})},"setupDoc"),Xt=h((t,e=Qt)=>{let s=e;if(t.doc)for(let a of t.doc)a.stmt==="dir"&&(s=a.value);return s},"getDir");function Q(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(r=>{let u=s.get(r);u&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...u.styles])}));let a=t.find(r=>r.id===e.id);a?Object.assign(a,e):t.push(e)}h(Q,"insertOrUpdateNode");function ce(t){return t?.classes?.join(" ")??""}h(ce,"getClassesFromDbInfo");function he(t){return t?.styles??[]}h(he,"getStylesFromDbInfo");var Z=h((t,e,s,a,r,u,d,S)=>{let f=e.id,T=s.get(f),b=ce(T),_=he(T),x=w();if(k.info("dataFetcher parsedItem",e,T,_),f!=="root"){let v=Dt;e.start===!0?v=Ee:e.start===!1&&(v=be),e.type!==tt&&(v=e.type),yt.get(f)||yt.set(f,{id:f,shape:v,description:G.sanitizeText(f,x),cssClasses:`${b} ${De}`,cssStyles:_});let p=yt.get(f);e.description&&(Array.isArray(p.description)?(p.shape=vt,p.description.push(e.description)):p.description?.length&&p.description.length>0?(p.shape=vt,p.description===f?p.description=[e.description]:p.description=[p.description,e.description]):(p.shape=Dt,p.description=e.description),p.description=G.sanitizeTextOrArray(p.description,x)),p.description?.length===1&&p.shape===vt&&(p.type==="group"?p.shape=zt:p.shape=Dt),!p.type&&e.doc&&(k.info("Setting cluster for XCX",f,Xt(e)),p.type="group",p.isGroup=!0,p.dir=Xt(e),p.shape=e.type===Zt?Wt:zt,p.cssClasses=`${p.cssClasses} ${Ie} ${u?Re:""}`);let D={labelStyle:"",shape:p.shape,label:p.description,cssClasses:p.cssClasses,cssCompiledStyles:[],cssStyles:p.cssStyles,id:f,dir:p.dir,domId:gt(f,B),type:p.type,isGroup:p.type==="group",padding:8,rx:10,ry:10,look:d};if(D.shape===Wt&&(D.label=""),t&&t.id!=="root"&&(k.trace("Setting node ",f," to be child of its parent ",t.id),D.parentId=t.id),D.centerLabel=!0,e.note){let R={labelStyle:"",shape:_e,label:e.note.text,cssClasses:xe,cssStyles:[],cssCompiledStyles:[],id:f+we+"-"+B,domId:gt(f,B,oe),type:p.type,isGroup:p.type==="group",padding:x.flowchart?.padding,look:d,position:e.note.position},L=f+Kt,$={labelStyle:"",shape:ke,label:e.note.text,cssClasses:p.cssClasses,cssStyles:[],id:f+Kt,domId:gt(f,B,ne),type:"group",isGroup:!0,padding:16,look:d,position:e.note.position};B++,$.id=L,R.parentId=L,Q(a,$,S),Q(a,R,S),Q(a,D,S);let I=f,P=R.id;e.note.position==="left of"&&(I=R.id,P=f),r.push({id:I+"-"+P,start:I,end:P,arrowhead:"none",arrowTypeEnd:"",style:te,labelStyle:"",classes:Ae,arrowheadStyle:ee,labelpos:se,labelType:ie,thickness:re,look:d})}else Q(a,D,S)}e.doc&&(k.trace("Adding nodes children "),Fe(e,e.doc,s,a,r,!u,d,S))},"dataFetcher"),Ye=h(()=>{yt.clear(),B=0},"reset"),A={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Jt=h(()=>new Map,"newClassesList"),qt=h(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),St=h(t=>JSON.parse(JSON.stringify(t)),"clone"),X,Je=(X=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Jt(),this.documents={root:qt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=$t,this.setAccTitle=wt,this.getAccDescription=Ft,this.setAccDescription=Pt,this.setDiagramTitle=Yt,this.getDiagramTitle=Gt,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(e){this.clear(!0);for(let r of Array.isArray(e)?e:e.doc)switch(r.stmt){case K:this.addState(r.id.trim(),r.type,r.doc,r.description,r.note);break;case At:this.addRelation(r.state1,r.state2,r.description);break;case ye:this.addStyleClass(r.id.trim(),r.classes);break;case ge:this.handleStyleDef(r);break;case Te:this.setCssClass(r.id.trim(),r.styleClass);break;case"click":this.addLink(r.id,r.url,r.tooltip);break}let s=this.getStates(),a=w();Ye(),Z(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,a.look,this.classes);for(let r of this.nodes)if(Array.isArray(r.label)){if(r.description=r.label.slice(1),r.isGroup&&r.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${r.id}]`);r.label=r.label[0]}}handleStyleDef(e){let s=e.id.trim().split(","),a=e.styleClass.split(",");for(let r of s){let u=this.getState(r);if(!u){let d=r.trim();this.addState(d),u=this.getState(d)}u&&(u.styles=a.map(d=>d.replace(/;/g,"")?.trim()))}}setRootDoc(e){k.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,a){if(s.stmt===At){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===K&&(s.id===A.START_NODE?(s.id=e.id+(a?"_start":"_end"),s.start=a):s.id=s.id.trim()),s.stmt!==z&&s.stmt!==K||!s.doc)return;let r=[],u=[];for(let d of s.doc)if(d.type===Zt){let S=St(d);S.doc=St(u),r.push(S),u=[]}else u.push(d);if(r.length>0&&u.length>0){let d={stmt:K,id:Bt(),type:"divider",doc:St(u)};r.push(St(d)),s.doc=r}s.doc.forEach(d=>this.docTranslator(s,d,!0))}getRootDocV2(){return this.docTranslator({id:z,stmt:z},{id:z,stmt:z,doc:this.rootDoc},!0),{id:z,doc:this.rootDoc}}addState(e,s=tt,a=void 0,r=void 0,u=void 0,d=void 0,S=void 0,f=void 0){let T=e?.trim();if(!this.currentDocument.states.has(T))k.info("Adding state ",T,r),this.currentDocument.states.set(T,{stmt:K,id:T,descriptions:[],type:s,doc:a,note:u,classes:[],styles:[],textStyles:[]});else{let b=this.currentDocument.states.get(T);if(!b)throw new Error(`State not found: ${T}`);b.doc||(b.doc=a),b.type||(b.type=s)}if(r&&(k.info("Setting state description",T,r),(Array.isArray(r)?r:[r]).forEach(_=>this.addDescription(T,_.trim()))),u){let b=this.currentDocument.states.get(T);if(!b)throw new Error(`State not found: ${T}`);b.note=u,b.note.text=G.sanitizeText(b.note.text,w())}d&&(k.info("Setting state classes",T,d),(Array.isArray(d)?d:[d]).forEach(_=>this.setCssClass(T,_.trim()))),S&&(k.info("Setting state styles",T,S),(Array.isArray(S)?S:[S]).forEach(_=>this.setStyle(T,_.trim()))),f&&(k.info("Setting state styles",T,S),(Array.isArray(f)?f:[f]).forEach(_=>this.setTextStyle(T,_.trim())))}clear(e){this.nodes=[],this.edges=[],this.documents={root:qt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Jt(),e||(this.links=new Map,Nt())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){k.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,a){this.links.set(e,{url:s,tooltip:a}),k.warn("Adding link",e,s,a)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===A.START_NODE?(this.startEndCount++,`${A.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=tt){return e===A.START_NODE?A.START_TYPE:s}endIdIfNeeded(e=""){return e===A.END_NODE?(this.startEndCount++,`${A.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=tt){return e===A.END_NODE?A.END_TYPE:s}addRelationObjs(e,s,a=""){let r=this.startIdIfNeeded(e.id.trim()),u=this.startTypeIfNeeded(e.id.trim(),e.type),d=this.startIdIfNeeded(s.id.trim()),S=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(r,u,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(d,S,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:r,id2:d,relationTitle:G.sanitizeText(a,w())})}addRelation(e,s,a){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,a);else if(typeof e=="string"&&typeof s=="string"){let r=this.startIdIfNeeded(e.trim()),u=this.startTypeIfNeeded(e),d=this.endIdIfNeeded(s.trim()),S=this.endTypeIfNeeded(s);this.addState(r,u),this.addState(d,S),this.currentDocument.relations.push({id1:r,id2:d,relationTitle:a?G.sanitizeText(a,w()):void 0})}}addDescription(e,s){let a=this.currentDocument.states.get(e),r=s.startsWith(":")?s.replace(":","").trim():s;a?.descriptions?.push(G.sanitizeText(r,w()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});let a=this.classes.get(e);s&&a&&s.split(A.STYLECLASS_SEP).forEach(r=>{let u=r.replace(/([^;]*);/,"$1").trim();if(RegExp(A.COLOR_KEYWORD).exec(r)){let S=u.replace(A.FILL_KEYWORD,A.BG_FILL).replace(A.COLOR_KEYWORD,A.FILL_KEYWORD);a.textStyles.push(S)}a.styles.push(u)})}getClasses(){return this.classes}setCssClass(e,s){e.split(",").forEach(a=>{let r=this.getState(a);if(!r){let u=a.trim();this.addState(u),r=this.getState(u)}r?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===Ht)}getDirection(){return this.getDirectionStatement()?.value??Se}setDirection(e){let s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:Ht,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){let e=w();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:le(this.getRootDocV2())}}getConfig(){return w().state}},h(X,"StateDB"),X.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},X),Ge=h(t=>`
defs #statediagram-barbEnd {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: 1;
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: 1;
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: 1px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: 1px;
}
#statediagram-barbEnd {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: 1px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

#dependencyStart, #dependencyEnd {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: 1;
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}
`,"getStyles"),qe=Ge;export{Ke as a,Xe as b,Je as c,qe as d};
