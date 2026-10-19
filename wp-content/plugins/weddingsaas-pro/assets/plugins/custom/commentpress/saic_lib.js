/**
 * jQuery jPages v0.7
 * Client side pagination with jQuery
 * http://luis-almeida.github.com/jPages
 *
 * Licensed under the MIT license.
 * Copyright 2012 Luís Almeida
 * https://github.com/luis-almeida
 */
;(function($,window,document,undefined){var name="jPages",instance=null,defaults={containerID:"",first:false,previous:"← previous",next:"next →",last:false,links:"numeric",startPage:1,perPage:10,midRange:5,startRange:1,endRange:1,keyBrowse:false,scrollBrowse:false,pause:0,clickStop:false,delay:50,direction:"forward",animation:"",fallback:400,minHeight:true,callback:undefined};function Plugin(element,options){this.options=$.extend({},defaults,options);this._container=$("#"+this.options.containerID);if(!this._container.length)return;this.jQwindow=$(window);this.jQdocument=$(document);this._holder=$(element);this._nav={};this._first=$(this.options.first);this._previous=$(this.options.previous);this._next=$(this.options.next);this._last=$(this.options.last);this._items=this._container.children(":visible");this._itemsShowing=$([]);this._itemsHiding=$([]);this._numPages=Math.ceil(this._items.length/this.options.perPage);this._currentPageNum=this.options.startPage;this._clicked=false;this._cssAnimSupport=this.getCSSAnimationSupport();this.init();}Plugin.prototype={constructor:Plugin,getCSSAnimationSupport:function(){var animation=false,animationstring='animation',keyframeprefix='',domPrefixes='Webkit Moz O ms Khtml'.split(' '),pfx='',elm=this._container.get(0);if(elm.style.animationName)animation=true;if(animation===false){for(var i=0;i<domPrefixes.length;i++){if(elm.style[domPrefixes[i]+'AnimationName']!==undefined){pfx=domPrefixes[i];animationstring=pfx+'Animation';keyframeprefix='-'+pfx.toLowerCase()+'-';animation=true;break;}}}return animation;},init:function(){this.setStyles();this.setNav();this.paginate(this._currentPageNum);this.setMinHeight();},setStyles:function(){var requiredStyles="<style>"+".jp-invisible { visibility: hidden !important; } "+".jp-hidden { display: none !important; }"+"</style>";$(requiredStyles).appendTo("head");if(this._cssAnimSupport&&this.options.animation.length)this._items.addClass("animated jp-hidden");else this._items.hide();},setNav:function(){var navhtml=this.writeNav();this._holder.each(this.bind(function(index,element){var holder=$(element);holder.html(navhtml);this.cacheNavElements(holder,index);this.bindNavHandlers(index);this.disableNavSelection(element);},this));if(this.options.keyBrowse)this.bindNavKeyBrowse();if(this.options.scrollBrowse)this.bindNavScrollBrowse();},writeNav:function(){var i=1,navhtml;navhtml=this.writeBtn("first")+this.writeBtn("previous");for(;i<=this._numPages;i++){if(i===1&&this.options.startRange===0)navhtml+="<span>...</span>";if(i>this.options.startRange&&i<=this._numPages-this.options.endRange)navhtml+="<a href='#' class='jp-hidden'>";else
navhtml+="<a>";switch(this.options.links){case"numeric":navhtml+=i;break;case"blank":break;case"title":var title=this._items.eq(i-1).attr("data-title");navhtml+=title!==undefined?title:"";break;}navhtml+="</a>";if(i===this.options.startRange||i===this._numPages-this.options.endRange)navhtml+="<span>...</span>";}navhtml+=this.writeBtn("next")+this.writeBtn("last")+"</div>";return navhtml;},writeBtn:function(which){return this.options[which]!==false&&!$(this["_"+which]).length?"<a class='jp-"+which+"'>"+this.options[which]+"</a>":"";},cacheNavElements:function(holder,index){this._nav[index]={};this._nav[index].holder=holder;this._nav[index].first=this._first.length?this._first:this._nav[index].holder.find("a.jp-first");this._nav[index].previous=this._previous.length?this._previous:this._nav[index].holder.find("a.jp-previous");this._nav[index].next=this._next.length?this._next:this._nav[index].holder.find("a.jp-next");this._nav[index].last=this._last.length?this._last:this._nav[index].holder.find("a.jp-last");this._nav[index].fstBreak=this._nav[index].holder.find("span:first");this._nav[index].lstBreak=this._nav[index].holder.find("span:last");this._nav[index].pages=this._nav[index].holder.find("a").not(".jp-first, .jp-previous, .jp-next, .jp-last");this._nav[index].permPages=this._nav[index].pages.slice(0,this.options.startRange).add(this._nav[index].pages.slice(this._numPages-this.options.endRange,this._numPages));this._nav[index].pagesShowing=$([]);this._nav[index].currentPage=$([]);},bindNavHandlers:function(index){var nav=this._nav[index];nav.holder.bind("click.jPages",this.bind(function(evt){var newPage=this.getNewPage(nav,$(evt.target));if(this.validNewPage(newPage)){this._clicked=true;this.paginate(newPage);}evt.preventDefault();},this));if(this._first.length){this._first.bind("click.jPages",this.bind(function(){if(this.validNewPage(1)){this._clicked=true;this.paginate(1);}},this));}if(this._previous.length){this._previous.bind("click.jPages",this.bind(function(){var newPage=this._currentPageNum-1;if(this.validNewPage(newPage)){this._clicked=true;this.paginate(newPage);}},this));}if(this._next.length){this._next.bind("click.jPages",this.bind(function(){var newPage=this._currentPageNum+1;if(this.validNewPage(newPage)){this._clicked=true;this.paginate(newPage);}},this));}if(this._last.length){this._last.bind("click.jPages",this.bind(function(){if(this.validNewPage(this._numPages)){this._clicked=true;this.paginate(this._numPages);}},this));}},disableNavSelection:function(element){if(typeof element.onselectstart!="undefined")element.onselectstart=function(){return false;};else if(typeof element.style.MozUserSelect!="undefined")element.style.MozUserSelect="none";else
element.onmousedown=function(){return false;};},bindNavKeyBrowse:function(){this.jQdocument.bind("keydown.jPages",this.bind(function(evt){var target=evt.target.nodeName.toLowerCase();if(this.elemScrolledIntoView()&&target!=="input"&&target!="textarea"){var newPage=this._currentPageNum;if(evt.which==37)newPage=this._currentPageNum-1;if(evt.which==39)newPage=this._currentPageNum+1;if(this.validNewPage(newPage)){this._clicked=true;this.paginate(newPage);}}},this));},elemScrolledIntoView:function(){var docViewTop,docViewBottom,elemTop,elemBottom;docViewTop=this.jQwindow.scrollTop();docViewBottom=docViewTop+this.jQwindow.height();elemTop=this._container.offset().top;elemBottom=elemTop+this._container.height();return((elemBottom>=docViewTop)&&(elemTop<=docViewBottom));},bindNavScrollBrowse:function(){this._container.bind("mousewheel.jPages DOMMouseScroll.jPages",this.bind(function(evt){var newPage=(evt.originalEvent.wheelDelta||-evt.originalEvent.detail)>0?(this._currentPageNum-1):(this._currentPageNum+1);if(this.validNewPage(newPage)){this._clicked=true;this.paginate(newPage);}evt.preventDefault();return false;},this));},getNewPage:function(nav,target){if(target.is(nav.currentPage))return this._currentPageNum;if(target.is(nav.pages))return nav.pages.index(target)+1;if(target.is(nav.first))return 1;if(target.is(nav.last))return this._numPages;if(target.is(nav.previous))return nav.pages.index(nav.currentPage);if(target.is(nav.next))return nav.pages.index(nav.currentPage)+2;},validNewPage:function(newPage){return newPage!==this._currentPageNum&&newPage>0&&newPage<=this._numPages;},paginate:function(page){var itemRange,pageInterval;itemRange=this.updateItems(page);pageInterval=this.updatePages(page);this._currentPageNum=page;if($.isFunction(this.options.callback))this.callback(page,itemRange,pageInterval);this.updatePause();},updateItems:function(page){var range=this.getItemRange(page);this._itemsHiding=this._itemsShowing;this._itemsShowing=this._items.slice(range.start,range.end);if(this._cssAnimSupport&&this.options.animation.length)this.cssAnimations(page);else this.jQAnimations(page);return range;},getItemRange:function(page){var range={};range.start=(page-1)*this.options.perPage;range.end=range.start+this.options.perPage;if(range.end>this._items.length)range.end=this._items.length;return range;},cssAnimations:function(page){clearInterval(this._delay);this._itemsHiding.removeClass(this.options.animation+" jp-invisible").addClass("jp-hidden");this._itemsShowing.removeClass("jp-hidden").addClass("jp-invisible");this._itemsOriented=this.getDirectedItems(page);this._index=0;this._delay=setInterval(this.bind(function(){if(this._index===this._itemsOriented.length)clearInterval(this._delay);else{this._itemsOriented.eq(this._index).removeClass("jp-invisible").addClass(this.options.animation);}this._index=this._index+1;},this),this.options.delay);},jQAnimations:function(page){clearInterval(this._delay);this._itemsHiding.addClass("jp-hidden");this._itemsShowing.fadeTo(0,0).removeClass("jp-hidden");this._itemsOriented=this.getDirectedItems(page);this._index=0;this._delay=setInterval(this.bind(function(){if(this._index===this._itemsOriented.length)clearInterval(this._delay);else{this._itemsOriented.eq(this._index).fadeTo(this.options.fallback,1);}this._index=this._index+1;},this),this.options.delay);},getDirectedItems:function(page){var itemsToShow;switch(this.options.direction){case"backwards":itemsToShow=$(this._itemsShowing.get().reverse());break;case"random":itemsToShow=$(this._itemsShowing.get().sort(function(){return(Math.round(Math.random())-0.5);}));break;case"auto":itemsToShow=page>=this._currentPageNum?this._itemsShowing:$(this._itemsShowing.get().reverse());break;default:itemsToShow=this._itemsShowing;}return itemsToShow;},updatePages:function(page){var interval,index,nav;interval=this.getInterval(page);for(index in this._nav){if(this._nav.hasOwnProperty(index)){nav=this._nav[index];this.updateBtns(nav,page);this.updateCurrentPage(nav,page);this.updatePagesShowing(nav,interval);this.updateBreaks(nav,interval);}}return interval;},getInterval:function(page){var neHalf,upperLimit,start,end;neHalf=Math.ceil(this.options.midRange/2);upperLimit=this._numPages-this.options.midRange;start=page>neHalf?Math.max(Math.min(page-neHalf,upperLimit),0):0;end=page>neHalf?Math.min(page+neHalf-(this.options.midRange%2>0?1:0),this._numPages):Math.min(this.options.midRange,this._numPages);return{start:start,end:end};},updateBtns:function(nav,page){if(page===1){nav.first.addClass("jp-disabled");nav.previous.addClass("jp-disabled");}if(page===this._numPages){nav.next.addClass("jp-disabled");nav.last.addClass("jp-disabled");}if(this._currentPageNum===1&&page>1){nav.first.removeClass("jp-disabled");nav.previous.removeClass("jp-disabled");}if(this._currentPageNum===this._numPages&&page<this._numPages){nav.next.removeClass("jp-disabled");nav.last.removeClass("jp-disabled");}},updateCurrentPage:function(nav,page){nav.currentPage.removeClass("jp-current");nav.currentPage=nav.pages.eq(page-1).addClass("jp-current");},updatePagesShowing:function(nav,interval){var newRange=nav.pages.slice(interval.start,interval.end).not(nav.permPages);nav.pagesShowing.not(newRange).addClass("jp-hidden");newRange.not(nav.pagesShowing).removeClass("jp-hidden");nav.pagesShowing=newRange;},updateBreaks:function(nav,interval){if(interval.start>this.options.startRange||(this.options.startRange===0&&interval.start>0))nav.fstBreak.removeClass("jp-hidden");else nav.fstBreak.addClass("jp-hidden");if(interval.end<this._numPages-this.options.endRange)nav.lstBreak.removeClass("jp-hidden");else nav.lstBreak.addClass("jp-hidden");},callback:function(page,itemRange,pageInterval){var pages={current:page,interval:pageInterval,count:this._numPages},items={showing:this._itemsShowing,oncoming:this._items.slice(itemRange.start+this.options.perPage,itemRange.end+this.options.perPage),range:itemRange,count:this._items.length};pages.interval.start=pages.interval.start+1;items.range.start=items.range.start+1;this.options.callback(pages,items);},updatePause:function(){if(this.options.pause&&this._numPages>1){clearTimeout(this._pause);if(this.options.clickStop&&this._clicked)return;else{this._pause=setTimeout(this.bind(function(){this.paginate(this._currentPageNum!==this._numPages?this._currentPageNum+1:1);},this),this.options.pause);}}},setMinHeight:function(){if(this.options.minHeight&&!this._container.is("table, tbody")){setTimeout(this.bind(function(){this._container.css({"min-height":this._container.css("height")});},this),1000);}},bind:function(fn,me){return function(){return fn.apply(me,arguments);};},destroy:function(){this.jQdocument.unbind("keydown.jPages");this._container.unbind("mousewheel.jPages DOMMouseScroll.jPages");if(this.options.minHeight)this._container.css("min-height","");if(this._cssAnimSupport&&this.options.animation.length)this._items.removeClass("animated jp-hidden jp-invisible "+this.options.animation);else this._items.removeClass("jp-hidden").fadeTo(0,1);this._holder.unbind("click.jPages").empty();}};$.fn[name]=function(arg){var type=$.type(arg);if(type==="object"){if(this.length&&!$.data(this,name)){instance=new Plugin(this,arg);this.each(function(){$.data(this,name,instance);});}return this;}if(type==="string"&&arg==="destroy"){instance.destroy();this.each(function(){$.removeData(this,name);});return this;}if(type==='number'&&arg%1===0){if(instance.validNewPage(arg))instance.paginate(arg);return this;}return this;};})(jQuery,window,document);

/*
 * jQuery Textarea Characters Counter Plugin v 2.0
 * Examples and documentation at: http://roy-jin.appspot.com/jsp/textareaCounter.jsp
 * Copyright (c) 2010 Roy Jin
 * Version: 2.0 (11-JUN-2010)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Requires: jQuery v1.4.2 or later
 */
(function($){  
	$.fn.textareaCount = function(options, fn) {   
		var defaults = {  
			maxCharacterSize: -1,  
			originalStyle: 'originalTextareaInfo',
			warningStyle: 'warningTextareaInfo',  
			warningNumber: 20,
			displayFormat: '#input characters | #words words'
		};  
		var options = $.extend(defaults, options);
		
		var container = $(this);
		
		$("<div class='charleft'>&nbsp;</div>").insertAfter(container);
		
		//create charleft css
		var charLeftCss = {
			'width' : container.width()
		};
		
		var charLeftInfo = getNextCharLeftInformation(container);
		charLeftInfo.addClass(options.originalStyle);
		//charLeftInfo.css(charLeftCss); //línea modificada por max lopez
		
		var numInput = 0;
		var maxCharacters = options.maxCharacterSize;
		var numLeft = 0;
		var numWords = 0;
				
		container.bind('keyup', function(event){limitTextAreaByCharacterCount();})
				 .bind('mouseover', function(event){setTimeout(function(){limitTextAreaByCharacterCount();}, 10);})
				 .bind('paste', function(event){setTimeout(function(){limitTextAreaByCharacterCount();}, 10);});
		
		
		function limitTextAreaByCharacterCount(){
			charLeftInfo.html(countByCharacters());
			//function call back
			if(typeof fn != 'undefined'){
				fn.call(this, getInfo());
			}
			return true;
		}
		
		function countByCharacters(){
			var content = container.val();
			var contentLength = content.length;
			
			//Start Cut
			if(options.maxCharacterSize > 0){
				//If copied content is already more than maxCharacterSize, chop it to maxCharacterSize.
				if(contentLength >= options.maxCharacterSize) {
					content = content.substring(0, options.maxCharacterSize); 				
				}
				
				var newlineCount = getNewlineCount(content);
				
				// newlineCount new line character. For windows, it occupies 2 characters
				var systemmaxCharacterSize = options.maxCharacterSize - newlineCount;
				if (!isWin()){
					 systemmaxCharacterSize = options.maxCharacterSize
				}
				if(contentLength > systemmaxCharacterSize){
					//avoid scroll bar moving
					var originalScrollTopPosition = this.scrollTop;
					container.val(content.substring(0, systemmaxCharacterSize));
					this.scrollTop = originalScrollTopPosition;
				}
				charLeftInfo.removeClass(options.warningStyle);
				if(systemmaxCharacterSize - contentLength <= options.warningNumber){
					charLeftInfo.addClass(options.warningStyle);
				}
				
				numInput = container.val().length + newlineCount;
				if(!isWin()){
					numInput = container.val().length;
				}
			
				numWords = countWord(getCleanedWordString(container.val()));
				
				numLeft = maxCharacters - numInput;
			} else {
				//normal count, no cut
				var newlineCount = getNewlineCount(content);
				numInput = container.val().length + newlineCount;
				if(!isWin()){
					numInput = container.val().length;
				}
				numWords = countWord(getCleanedWordString(container.val()));
			}
			
			return formatDisplayInfo();
		}
		
		function formatDisplayInfo(){
			var format = options.displayFormat;
			format = format.replace('#input', numInput);
			format = format.replace('#words', numWords);
			//When maxCharacters <= 0, #max, #left cannot be substituted.
			if(maxCharacters > 0){
				format = format.replace('#max', maxCharacters);
				format = format.replace('#left', numLeft);
			}
			return format;
		}
		
		function getInfo(){
			var info = {
				input: numInput,
				max: maxCharacters,
				left: numLeft,
				words: numWords
			};
			return info;
		}
		
		function getNextCharLeftInformation(container){
				return container.next('.charleft');
		}
		
		function isWin(){
			var strOS = navigator.appVersion;
			if (strOS.toLowerCase().indexOf('win') != -1){
				return true;
			}
			return false;
		}
		
		function getNewlineCount(content){
			var newlineCount = 0;
			for(var i=0; i<content.length;i++){
				if(content.charAt(i) == '\n'){
					newlineCount++;
				}
			}
			return newlineCount;
		}
		
		function getCleanedWordString(content){
			var fullStr = content + " ";
			var initial_whitespace_rExp = /^[^A-Za-z0-9]+/gi;
			var left_trimmedStr = fullStr.replace(initial_whitespace_rExp, "");
			var non_alphanumerics_rExp = rExp = /[^A-Za-z0-9]+/gi;
			var cleanedStr = left_trimmedStr.replace(non_alphanumerics_rExp, " ");
			var splitString = cleanedStr.split(" ");
			return splitString;
		}
		
		function countWord(cleanedWordString){
			var word_count = cleanedWordString.length-1;
			return word_count;
		}
	};  
})(jQuery);

/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(f,h,$){var a='placeholder' in h.createElement('input'),d='placeholder' in h.createElement('textarea'),i=$.fn,c=$.valHooks,k,j;if(a&&d){j=i.placeholder=function(){return this};j.input=j.textarea=true}else{j=i.placeholder=function(){var l=this;l.filter((a?'textarea':':input')+'[placeholder]').not('.placeholder').bind({'focus.placeholder':b,'blur.placeholder':e}).data('placeholder-enabled',true).trigger('blur.placeholder');return l};j.input=a;j.textarea=d;k={get:function(m){var l=$(m);return l.data('placeholder-enabled')&&l.hasClass('placeholder')?'':m.value},set:function(m,n){var l=$(m);if(!l.data('placeholder-enabled')){return m.value=n}if(n==''){m.value=n;if(m!=h.activeElement){e.call(m)}}else{if(l.hasClass('placeholder')){b.call(m,true,n)||(m.value=n)}else{m.value=n}}return l}};a||(c.input=k);d||(c.textarea=k);$(function(){$(h).delegate('form','submit.placeholder',function(){var l=$('.placeholder',this).each(b);setTimeout(function(){l.each(e)},10)})});$(f).bind('beforeunload.placeholder',function(){$('.placeholder').each(function(){this.value=''})})}function g(m){var l={},n=/^jQuery\d+$/;$.each(m.attributes,function(p,o){if(o.specified&&!n.test(o.name)){l[o.name]=o.value}});return l}function b(m,n){var l=this,o=$(l);if(l.value==o.attr('placeholder')&&o.hasClass('placeholder')){if(o.data('placeholder-password')){o=o.hide().next().show().attr('id',o.removeAttr('id').data('placeholder-id'));if(m===true){return o[0].value=n}o.focus()}else{l.value='';o.removeClass('placeholder');l==h.activeElement&&l.select()}}}function e(){var q,l=this,p=$(l),m=p,o=this.id;if(l.value==''){if(l.type=='password'){if(!p.data('placeholder-textinput')){try{q=p.clone().attr({type:'text'})}catch(n){q=$('<input>').attr($.extend(g(this),{type:'text'}))}q.removeAttr('name').data({'placeholder-password':true,'placeholder-id':o}).bind('focus.placeholder',b);p.data({'placeholder-textinput':q,'placeholder-id':o}).before(q)}p=p.removeAttr('id').hide().prev().attr('id',o).show()}p.addClass('placeholder');p[0].value=p.attr('placeholder')}else{p.removeClass('placeholder')}}}(this,document,jQuery));

/*!
	Autosize 3.0.13
	license: MIT
	http://www.jacklmoore.com/autosize
*/
!function(e,t){if("function"==typeof define&&define.amd)define(["exports","module"],t);else if("undefined"!=typeof exports&&"undefined"!=typeof module)t(exports,module);else{var n={exports:{}};t(n.exports,n),e.autosize=n.exports}}(this,function(e,t){"use strict";function n(e){function t(){var t=window.getComputedStyle(e,null);c=t.overflowY,"vertical"===t.resize?e.style.resize="none":"both"===t.resize&&(e.style.resize="horizontal"),f="content-box"===t.boxSizing?-(parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)):parseFloat(t.borderTopWidth)+parseFloat(t.borderBottomWidth),isNaN(f)&&(f=0),i()}function n(t){var n=e.style.width;e.style.width="0px",e.offsetWidth,e.style.width=n,c=t,u&&(e.style.overflowY=t),o()}function o(){var t=window.pageYOffset,n=document.body.scrollTop,o=e.style.height;e.style.height="auto";var i=e.scrollHeight+f;return 0===e.scrollHeight?void(e.style.height=o):(e.style.height=i+"px",v=e.clientWidth,document.documentElement.scrollTop=t,void(document.body.scrollTop=n))}function i(){var t=e.style.height;o();var i=window.getComputedStyle(e,null);if(i.height!==e.style.height?"visible"!==c&&n("visible"):"hidden"!==c&&n("hidden"),t!==e.style.height){var r=document.createEvent("Event");r.initEvent("autosize:resized",!0,!1),e.dispatchEvent(r)}}var d=void 0===arguments[1]?{}:arguments[1],s=d.setOverflowX,l=void 0===s?!0:s,a=d.setOverflowY,u=void 0===a?!0:a;if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!r.has(e)){var f=null,c=null,v=e.clientWidth,p=function(){e.clientWidth!==v&&i()},h=function(t){window.removeEventListener("resize",p),e.removeEventListener("input",i),e.removeEventListener("keyup",i),e.removeEventListener("autosize:destroy",h),r["delete"](e),Object.keys(t).forEach(function(n){e.style[n]=t[n]})}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",h),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",i),window.addEventListener("resize",p),e.addEventListener("input",i),e.addEventListener("autosize:update",i),r.add(e),l&&(e.style.overflowX="hidden",e.style.wordWrap="break-word"),t()}}function o(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName){var t=document.createEvent("Event");t.initEvent("autosize:destroy",!0,!1),e.dispatchEvent(t)}}function i(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName){var t=document.createEvent("Event");t.initEvent("autosize:update",!0,!1),e.dispatchEvent(t)}}var r="function"==typeof Set?new Set:function(){var e=[];return{has:function(t){return Boolean(e.indexOf(t)>-1)},add:function(t){e.push(t)},"delete":function(t){e.splice(e.indexOf(t),1)}}}(),d=null;"undefined"==typeof window||"function"!=typeof window.getComputedStyle?(d=function(e){return e},d.destroy=function(e){return e},d.update=function(e){return e}):(d=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],function(e){return n(e,t)}),e},d.destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],o),e},d.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],i),e}),t.exports=d});