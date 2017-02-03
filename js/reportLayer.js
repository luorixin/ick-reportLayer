function report_layer (options) {
	var _this = this;
	_this.values=options['values'];
	_this.container=options['container'];
	_this.result=options['result'];
	_this.lang_opt = options["lang"] || "CN";
	_this.selectIds = options["selected"] || "";
	_this.callBack = options["callback"];
	_this.keyword = options["keyword"] || "audience_id";
	_this.ruleCondition = options["rules"];
	_this.autoColumn = options["autoColumn"] || [];
	_this.addRules = options["addRules"] || [];
	_this.initRule = options["initRule"] || [];
	_this.fixOrder = options["fixOrder"] || "";
	_this.clearColumn = options["clearColumn"] || [];
	_this.parent_layer = new Date().getTime();
	_this.child_layer=new Date().getTime()+999;
	_this.html="";
	_this.tabHtml="";
	_this.activeId="";
	_this.disabledCol=[];
	_this.clearCol = [];
	_this.selectArr=[];
	_this.layer_init();
}
report_layer.prototype.layer_init = function() {
	var _this = this;
	_this.renderHtml();
	_this.selectIds && _this.setSelected();
};
report_layer.prototype.forTab=function(o){
	var _this = this;
	var lang = _this.lang_opt=="CN"?"":"_en";
	var ulstr = "";
	_this.tabHtml="<ul class='pannel'>";
	for (var i = 0; i < o.length; i++) {
		_this.html="";
		var typeName = o[i]["tabName"+lang];
		var typeValues = o[i]["tabValues"];
		var active = i==0 ? "active":"";
		var display =i==0 ? "":"display:none";
		try{
			_this.tabHtml+='<li class="'+active+'" id="'+o[i]["tabName_en"]+'"><a data-toggle="tab" href="javascript:;">'+typeName+'</a></li>';
		}catch(e){}
		var listr= _this.forTree(typeValues);
		ulstr += "<ul id='"+_this.parent_layer+o[i]["tabName_en"]+"' class='tree' style='"+display+"'>"+listr+"</ul>";

	};
	_this.tabHtml+="</ul>"+ulstr;

	return _this.tabHtml;
}
report_layer.prototype.forTree = function(o){
	var _this = this;
	var lang = _this.lang_opt=="CN"?"":"_en";
	for(var i=0;i<o.length;i++){
		var url,str = "";

		var id=o[i][_this.keyword];

		try{
			if(typeof o[i]["url"] == "undefined"){
				urlstr = "<li><span id='"+id+"' title='"+ o[i]["name"+lang] +"'>&nbsp;"+ o[i]["name"+lang] +"</span><i class='transform-ico'></i><ul class='line'>";
			}else{
				urlstr = "<li><span id='"+id+"' title='"+ o[i]["name"+lang] +"'><a href="+ o[i]["url"] +">&nbsp;"+ o[i]["name"+lang] +"</a></span><i class='transform-ico'></i><ul>";	
			}
			_this.html += urlstr;
			if(o[i]["children"] != null && o[i]["children"].length>0){
				_this.forTree(o[i]["children"]);
			}
			_this.html += "</ul></li>";
		}catch(e){}
	}
	return _this.html;
}

report_layer.prototype.menuTree = function(){
	var _this = this;
	//给有子对象的元素加[+-]
	$(".tree ul",_this.container).each(function(index, element) {
		var ulContent = $(element).html();
		var spanContent = $(element).siblings("span").html();
        if(ulContent){
        	$(element).siblings("span").css("font-weight","bold");
			$(element).siblings("span").before('<i  class="button switch center_close"></i>')	;
		}
    });
	
	$(".tree",_this.container).on("click","li .transform-ico" , function(){
		var that = this;
		var ul = $(that).siblings("ul");
		var spanId = $(that).siblings("span");
		var noselect=false;
		var isAdd=false;
		if(($(that).parents(".tree").attr("id")==_this.parent_layer+_this.activeId) && !spanId.hasClass("selected") && !spanId.hasClass("disabled") && !spanId.parent().hasClass("removed")){
			
			if (ul.find("li").length>0) {
				ul.find("span").each(function(){
					if(!$(this).hasClass("selected") && !$(this).hasClass("disabled")){
						_this.addChild($(this).attr("id"));
						isAdd=true;
					}
					
				})
			}else{
				_this.addChild(spanId.attr("id"));
				isAdd = true;
			}
			isAdd && $(that).parent().hide();
			//如果是最后一个，父节点也需要隐藏
			var parent_select = [];
			//找到所有父节点
			$(that).parent().parent().parents("li").each(function(){
				var ti=this;
				$(ti).find("span").first().each(function(){
					parent_select.push($(this).attr("id"));
				})
			});
			//遍历父节点找到对应子节点，如果有未选中的则对应父节点也是未选中
			for (var i = 0; i < parent_select.length; i++) {
				var $parentSelectDom=$(_this.container).find(".parent_layer").find("#"+parent_select[i]);
				($parentSelectDom.siblings("ul").find("span.selected").length==$parentSelectDom.siblings("ul").find("span").length) && $parentSelectDom.parent().hide();
			};
			
			//统计
			_this.sum();
			//回调
			_this.callBack && typeof(_this.callBack)==="function" && _this.callBack(_this.selectIds);
		}
		
	})

	$(".tree",_this.container).on("click","li i.button" , function(){
		var ul = $(this).siblings("ul");
		if(ul.find("li").html() != null){
			if(ul.css("display") == "none" ){
				ul.show(300);
				$(this).removeClass('center_close');
				$(this).addClass('center_open');
			}else{
				ul.hide(300);
				$(this).removeClass('center_open');
				$(this).addClass('center_close');
			}
		}
	})

	
	$(_this.container).on("click",".delete",function(){
		var that = this;
		var id = $(that).siblings("span").attr("id");
		var oldClass=[];
		$(_this.container).find(".parent_layer").find("#"+id).removeClass("selected");
		$(_this.container).find(".parent_layer").find("#"+id).parent().show();
		$(_this.container).find(".parent_layer").find("#"+id).parent().parent().parents("li").each(function(){
			$(this).show();
		});
		
		$(that).parent().remove();
		

		_this.sum();
		//回调
		_this.callBack && typeof(_this.callBack)==="function" && _this.callBack(_this.selectIds);
	});

}
report_layer.prototype.addChild = function(id){
	var _this = this;
	var $parent = $(_this.container).find(".parent_layer").find("#"+id);
	if(!$parent.hasClass("selected") && !$parent.hasClass("disabled") && !$parent.parent().hasClass("removed")){
		$parent.addClass("selected");
		$parent.parent().hide();
		_this.showChild(id);
	}
}
report_layer.prototype.showChild = function(id){
	var _this = this;
	if($(_this.container).find("#"+_this.child_layer).find("#"+id).length==0){
		var $html = $(_this.container).find(".parent_layer").find("#"+id);
		if($html.length>0){
			var title = $html.attr("title");
			var name = $html.html();
			var html= "<li><i class='threeline-ico'></i><span id='"+id+"' title='"+title+"'>"+name+"</span><label class='delete'><img src='./images/shared/components/btn_del.png' /></label></li>";
			$(_this.container).find("#"+_this.child_layer).append(html);
		}
	}
}
report_layer.prototype.justify = function(){
	var _this = this,i=0,j,l,exColumn="",disColumns="",exColumnArr=[],disColumnArr=[],disabledCol="",isDisabled=false;
	if (_this.addRules.length>0) {
		//*UVUC，第三方ucvc: campaign，adgroup，date	为必选
		if ((","+_this.selectIds+",").indexOf(",campaign_id,")==-1 || (","+_this.selectIds+",").indexOf(",adgroup_id,")==-1 || (","+_this.selectIds+",").indexOf(",date,")==-1) {
			disabledCol +="unique_views,unique_clicks,unique_views_third_party,unique_clicks_third_party,";
		};
		if(_this.disabledCol.length>0){
			disabledCol+= _this.disabledCol.join(",")+",";
		}
		if (_this.clearCol.length>0) {
			disabledCol+= _this.clearCol.join(",")+",";
		};

		for (i; i < _this.addRules.length; i++) {
			exColumn= _this.addRules[i]["exColumn"];
			disColumns = _this.addRules[i]["disColumns"];
			if (exColumn && disColumns) {
				exColumnArr= exColumn.split(",");
				disColumnArr = disColumns.split(",");
				for (j = 0; j < exColumnArr.length; j++) {
					//已经判断需要disable的就无需在进行这个判断
					isDisabled = disabledCol && ((","+disabledCol+",").indexOf(","+exColumnArr[j]+",")>-1);
					if(!isDisabled && _this.selectIds && (","+_this.selectIds+",").indexOf(","+exColumnArr[j]+",")>-1){
						disabledCol+=disColumns+",";
						break;
					}
				};
				//反过来也是一样，互相制约
				for (l = 0; l < disColumnArr.length; l++) {
					//已经判断需要disable的就无需在进行这个判断
					isDisabled = disabledCol && ((","+disabledCol+",").indexOf(","+disColumnArr[l]+",")>-1);
					if(!isDisabled && _this.selectIds && (","+_this.selectIds+",").indexOf(","+disColumnArr[l]+",")>-1){
						disabledCol+=exColumn+",";
						break;
					}
				};
			};
		};
		
		_this.setDisabled(disabledCol.split(","));
		// console.log(disabledCol);
		
	};
}
report_layer.prototype.initRuleRmv = function(){
	var _this = this;
	if (_this.initRule.length>0) {
		for (var i = 0; i < _this.initRule.length; i++) {
			if(_this.initRule[i]["isRule"]){
				var rules = _this.initRule[i]["rules"].split(",");
				if (rules.length>0) {
					for (var j = 0; j < rules.length; j++) {
						$(_this.container).find(".parent_layer").find("#"+rules[j]).parent().addClass("removed");
					};
				};
			}
		};
		//如果是最后一个，父节点也需要隐藏
		//找到所有父节点
		$(_this.container).find(".parent_layer").find(".button").each(function(){
			if($(this).siblings("ul").find("li:not(.removed)").length==0){
				$(this).parent().addClass("removed");
			} else{
				$(this).parent().removeClass("removed");
			}
		});
	};
}
report_layer.prototype.changeInit = function(newInit){
	var _this = this,lenspan=0;
	if (newInit && _this.initRule.length>0) {
		var key = newInit.key;
		var value = newInit.val;
		if (key && value!="undefined") {
			for (var i = 0; i < _this.initRule.length; i++) {
				if (key==_this.initRule[i]["ruleKey"]) {
					var rules = _this.initRule[i]["rules"].split(",");
					
					if (rules.length>0) {
						for (var j = 0; j < rules.length; j++) {
							if(value){
								//已经选了的就不能选了
								$(_this.container).find(".child_layer").find("#"+rules[j]).parent().remove();
								$(_this.container).find(".parent_layer").find("#"+rules[j]).removeClass("selected");
								$(_this.container).find(".parent_layer").find("#"+rules[j]).parent().show().addClass("removed");
							}else{
								$(_this.container).find(".parent_layer").find("#"+rules[j]).parent().removeClass("removed");
							}
						};
						if (value) {
							_this.selectArr=[];
							var $span = $(_this.container).find("#"+_this.child_layer).find("span");
							$span.each(function(){
								if ($(_this.container).find(".parent_layer").find("#"+$(this).attr("id")).hasClass("selected")) {
									lenspan++;
									_this.selectArr.push($(this).attr("id"));
								};
							})
							_this.selectIds = _this.selectArr.join(",");
							$(_this.result).val(_this.selectIds);
						};
					};
				};
			};
			//如果是最后一个，父节点也需要隐藏
			//找到所有父节点
			$(_this.container).find(".parent_layer").find(".button").each(function(){
				if($(this).siblings("ul").find("li:not(.removed)").length==0){
					$(this).parent().show().addClass("removed");
				} else{
					$(this).parent().removeClass("removed");
				}
			});
		};
	};
}
report_layer.prototype.renderHtml = function(){
	var _this = this;
	var label_lang = _this.lang[_this.lang_opt]["pLabel"];
	var $parentHtml = $("<div class='parent_layer'></div>");
	var $childHtml = $("<div class='child_layer'><ul class='pannel'><span>"+label_lang[1]+"</span></ul><ul id='"+_this.child_layer+"' class='tree'></ul></div>");
	var $button = $('<div class="button_layer"></div>');
	$('<div id="report_layer" class="clearfloat"></div>').append($parentHtml).append($button).append($childHtml).appendTo(_this.container);
	
	var tabStr = _this.forTab(_this.values);
	$(".parent_layer",_this.container).append(tabStr);

	_this.menuTree();
	//通过初始化规则去除不该要的
	_this.initRuleRmv();
	

	_this.activeId = $(_this.container).find(".pannel").find(".active").attr("id");

	
	$(".parent_layer .pannel",_this.container).on("click","li a" , function(){
		$(".parent_layer .pannel",_this.container).find(".active").removeClass("active");
		$(this).parent().addClass("active");
		var id = $(this).parent().attr("id");
		$(".parent_layer .tree",_this.container).hide();
		$("#"+_this.parent_layer+id,_this.container).fadeIn();
		_this.activeId = id;
	})
	$(".transform-ico",_this.container).hover(function(){
		$(this).css("background-color","#ebebeb");
		$(this).siblings("span").css("background","#ebebeb");
		var ul = $(this).siblings("ul");
		if (ul.find("li").length>0) {
			ul.find("span").css("background","#ebebeb");
			ul.find(".transform-ico").css("background-color","#ebebeb");
		};
	},function(){
		$(this).css("background-color","");
		$(this).siblings("span").css("background","");
		var ul = $(this).siblings("ul");
		if (ul.find("li").length>0) {
			ul.find("span").css("background","");
			ul.find(".transform-ico").css("background-color","");
		};
	})
	var el = document.getElementById(_this.child_layer);
	new Sortable(el,{
		onEnd:function(evt){
			_this.sum();
		}
	});
	_this.sum();
}
report_layer.prototype.sum = function(){
	var _this = this,lenspan=0,leni=0;
	_this.selectArr=[];
	
	var $span = $(_this.container).find("#"+_this.child_layer).find("span");
	$span.each(function(){
		if ($(_this.container).find(".parent_layer").find("#"+$(this).attr("id")).hasClass("selected")) {
			lenspan++;
			_this.selectArr.push($(this).attr("id"));
		};
	})
	_this.selectIds = _this.selectArr.join(",");
	//矫正顺序
	_this.adjustSort();
	//验证规则
	_this.justify();
	//disabe the parent
	_this.justParent();
	
	$(_this.result).val(_this.selectIds);
	// $(_this.container).find("b").text(lenspan);
	
}
report_layer.prototype.justParent = function(){
	var _this = this;
	//所有子节点不可选，对应父节点disable
	$(_this.container).find(".parent_layer").find(".button").each(function(){
		var _bo = this;
		var disableSpan=0;
		var justifySpan =$(_bo).siblings("ul").find("span:not(.disabled)").length;
		
		$(_bo).siblings("ul").find("span:not(.disabled)").each(function(){
			if ($(this).siblings(".button").length>0 || $(this).parent().hasClass(".removed") || $(this).hasClass("selected")) {
				disableSpan++;
			};
		})
		if (disableSpan!=justifySpan) {
			$(_bo).siblings("span").removeClass("disabled");
		}else{
			$(_bo).siblings("span").addClass("disabled");
		}
	});
}
report_layer.prototype.adjustSort = function(){
	var _this = this,needSortedArr=[],fixOrderArr=[],needSorted="";
	if (_this.fixOrder && _this.selectArr.length>0) {
		fixOrderArr = _this.fixOrder.split(",");
		for (var i = 0; i < _this.selectArr.length; i++) {
			var selectId = ","+_this.selectArr[i]+",";
			if ((","+_this.fixOrder+",").indexOf(selectId)>-1) {
				needSortedArr.push(_this.selectArr[i]);
			};
		};
		if (_this.selectArr.length>0) {
			_this.selectArr=_this.minus(_this.selectArr,needSortedArr);
		};
		if(needSortedArr.length>0){
			// needSortedArr = _this.intersect(fixOrderArr,needSortedArr);
			needSorted=needSortedArr.join(",");
		}
		_this.selectIds = (_this.selectArr.length>0?_this.selectArr.join(","):"")+","+needSorted;
		_this.selectArr = _this.selectIds.split(",");
		$(_this.container).find("#"+_this.child_layer).empty();
		for (var i = 0; i < _this.selectArr.length; i++) {
			if (_this.selectArr[i]) {_this.showChild(_this.selectArr[i]);};
			
		};
	};

}
Array.prototype.contains = function(item){
  return RegExp("\\b"+item+"\\b").test(this);
};
Array.prototype.each = function(fn){  
    fn = fn || Function.K;  
     var a = [];  
     var args = Array.prototype.slice.call(arguments, 1);  
     for(var i = 0; i < this.length; i++){  
         var res = fn.apply(this,[this[i],i].concat(args));  
         if(res != null) a.push(res);  
     }  
     return a;  
};  
/**  
* 得到一个数组不重复的元素集合<br/>  
* 唯一化一个数组  
* @returns {Array} 由不重复元素构成的数组  
*/  
report_layer.prototype.uniquelize = function(a){  
     var ra = new Array();  
     for(var i = 0; i < a.length; i ++){  
         if(!ra.contains(a[i])){  
            ra.push(a[i]);  
         }  
     }  
     return ra;  
};  

//取数组交集
report_layer.prototype.intersect = function(a, b){ 
	var _this = this; 
	var arr = _this.uniquelize(a);
     return arr.each(function(o){return b.contains(o) ? o : null});  
}; 
report_layer.prototype.minus = function(a, b){  
	var _this = this;
	var arr = _this.uniquelize(a);
    return arr.each(function(o){return b.contains(o) ? null : o});  
};  
report_layer.prototype.setCampaign = function(campaign){
	var _this =this,i=0,j=0,k=0,rule=[],planType,condition="",disabledCol="",notTogether="interest",isExist=0,notExist=0;
	_this.disabledCol=[];
	if (campaign && campaign.length>0) {
		if (_this.ruleCondition && _this.ruleCondition.length>0) {
			for (j; j < _this.ruleCondition.length; j++) {
				if(_this.ruleCondition[j]["ruleType"]=="productType"){
					rule = _this.ruleCondition[j]["rules"];
					if (rule.length>0) {
						for (k=0; k < rule.length; k++) {
							planType= ","+rule[k]["planType"]+",";
							condition = rule[k]["condition"];
							
							for (i=0 ; i < campaign.length; i++) {
								if(planType.indexOf(","+campaign[i]+",")>-1){
									disabledCol+=condition+",";
								}
							};
						};
					};
				}
			};
		};
	};
	//* Adx的Interest Group不能够与其他产品一起生成
	for (i=0 ; i < campaign.length; i++) {
		if(campaign[i].indexOf("AD EXCHANGE")>-1){
			isExist++;
		}
		if (campaign[i].indexOf("AD EXCHANGE")==-1) {
			notExist++;
		};
	}
	//选择Campaign的个数如果大于1个，unique views 和unique clicks，就不能选
	if (campaign && campaign.length>1) {
		disabledCol += "unique_views,unique_clicks,";
	};
	if (isExist>0 && notExist>0) {
		disabledCol += notTogether+",";
	};
	disabledCol && (_this.disabledCol=disabledCol.split(","));
	// _this.setDisabled(_this.disabledCol);
	//统计
	_this.sum();
	
	//回调
	_this.callBack && typeof(_this.callBack)==="function" && _this.callBack(_this.selectIds);
}
report_layer.prototype.setDisabled = function(disabledCol){
	var _this = this,i=0,lenspan=0,leni=0;
	$(_this.container).find(".parent_layer").find(".disabled").each(function(){
		$(this).removeClass("disabled");
	})
	if (disabledCol && disabledCol.length>0) {
		for (i ; i < disabledCol.length; i++) {
			if(disabledCol[i]){
				$(_this.container).find(".parent_layer").find("#"+disabledCol[i]).removeClass("selected").addClass("disabled");
				$(_this.container).find(".parent_layer").find("#"+disabledCol[i]).parent().show();
				$(_this.container).find(".parent_layer").find("#"+disabledCol[i]).parent().parent().parents("li").each(function(){
					$(this).show();
					// $(this).find("span:first").removeClass("selected").addClass("disabled");
				});
				
				$(_this.container).find(".child_layer").find("#"+disabledCol[i]).parent().remove();
			}
		};

		_this.selectArr=[];
		var $span = $(_this.container).find("#"+_this.child_layer).find("span");
		$span.each(function(){
			if ($(_this.container).find(".parent_layer").find("#"+$(this).attr("id")).hasClass("selected")) {
				lenspan++;
				_this.selectArr.push($(this).attr("id"));
			};
		})
		_this.selectIds = _this.selectArr.join(",");
	};
			
}

report_layer.prototype.setAutoColumn = function(autoType,autoId){
	var _this = this,i=0,j,k,l,columns,column,addColumn="",addColumnArr=[],isClear=false;
	if (autoType && autoId && _this.autoColumn.length>0) {
		for (i ; i < _this.autoColumn.length; i++) {
			if(_this.autoColumn[i]["autoType"]==autoType){
				columns=_this.autoColumn[i]["autoColumns"];
				isClear = _this.autoColumn[i]["clear"];
				for (j = 0; j < columns.length; j++) {
					if(autoId == columns[j]["type"]){
						addColumn+=columns[j]["columns"]+",";
					}
				};
				
			}
		};
		if (addColumn) {
			// console.log(addColumn);
			//每次选中都要清空原来的
			isClear && _this.reset();
			addColumnArr = addColumn.split(",");
			if (_this.clearCol.length>0) {
				_this.clearCol=_this.minus(_this.clearCol,addColumnArr);
			};
			for (l = 0; l < addColumnArr.length; l++) {
				if(addColumnArr[l]){
					$(_this.container).find(".parent_layer").find("#"+addColumnArr[l]).removeClass("disabled");
					_this.addChild(addColumnArr[l]);
				}
			};
			//如果是最后一个，父节点也需要隐藏
			var parent_select = [];
			//找到所有父节点
			$(_this.container).find(".parent_layer").find(".button").each(function(){
				($(this).siblings("ul").find("span.selected").length==$(this).siblings("ul").find("span").length) && $(this).parent().hide();
			});
			
			//统计
			_this.sum();
			
			//回调
			_this.callBack && typeof(_this.callBack)==="function" && _this.callBack(_this.selectIds);
		};
	};
}
report_layer.prototype.clearColumns = function(autoType){
	var _this = this,i=0,j=0,clearColumn="",clearColumnArr=[],id;
	if (autoType && _this.clearColumn.length>0) {
		for (i ; i < _this.clearColumn.length; i++) {
			clearColumn = _this.clearColumn[i]["clearColumn"];
			if(autoType == _this.clearColumn[i]["clearType"] && clearColumn){
				clearColumnArr = clearColumn.split(",");
			}
		};
		if (clearColumnArr.length>0) {
			for (j ; j < clearColumnArr.length; j++) {
				id = clearColumnArr[j];
				$(_this.container).find(".child_layer").find("#"+id).parent().remove();
				$(_this.container).find(".parent_layer").find("#"+id).removeClass("selected");
				$(_this.container).find(".parent_layer").find("#"+id).parent().show();
				_this.clearCol.push(id);
			};
			$(_this.container).find(".parent_layer").find(".button").each(function(){
				($(this).siblings("ul").find("span.selected").length!=$(this).siblings("ul").find("span").length) && $(this).parent().show();
			});
			_this.sum();
		};
	};
}
report_layer.prototype.reset = function(){
	var _this = this;
	$(_this.container).find(".child_layer").find(".delete").each(function(){
		$(this).parent().remove();
	})
	$(_this.container).find(".parent_layer").find(".selected").each(function(){
		$(this).removeClass("selected");
		$(this).parent().show();
	})
	$(_this.container).find(".parent_layer").find(".button").each(function(){
		($(this).siblings("ul").find("span.selected").length!=$(this).siblings("ul").find("span").length) && $(this).parent().show();
	});
}
report_layer.prototype.setSelected = function(){
	var _this = this,l=_this.selectIds.length,selected = _this.selectIds,length=0;
	for (var i = 0,j = l; i < j; i++) {
		_this.addChild(selected[i]);
	};
	//统计
	_this.sum();
	
	//回调
	_this.callBack && typeof(_this.callBack)==="function" && _this.callBack(_this.selectIds);
}
report_layer.prototype.lang = {
	'CN' : {
			pLabel : ["兴趣标签","已选择 ", " 个兴趣标签","添加"]
		},
	'EN' : {
		pLabel : ["Interests","Selected columns", " ","Add"]
		
	}
}