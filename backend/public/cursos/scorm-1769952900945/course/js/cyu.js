var Answer;
var correct;
var incorrect;
var optionArray = new Array();
var questionObj = new Object();
var attempt = 0;
var xmlObj;
var flag;
function queryStrVal(key, queryStr, delim, equal){
	if(queryStr==null)
		queryStr = window.location.search;
		//alert(queryStr);
	if(queryStr.indexOf("?")==0)
		queryStr = queryStr.substring(1,queryStr.length);
	if(delim==null)
		delim ="&"
	if(equal==null)
		equal ="="
	
	if (queryStr.indexOf(key) != -1){
		var ary1 = queryStr.split(delim);
		for(var i=0;i<ary1.length;i++){
			var ary2 = ary1[i].split(equal)
			if(ary2[0]==key){
				return ary1[i].substring((ary1[i].indexOf(equal)+1),ary1[i].length);
			}
		}
	}
	return null;
}

function loadXML(filePath, callback, options){
				
	$.get(filePath,function(data){
		callback(data, options);
	});
	
}
		
$(document).ready(function(){
	
	var filePath = parent.Framework.kcPath+queryStrVal('xml');//Get query string
	loadXML(filePath,parseXML,'');
	$('#but-next, #screen_feedback').hide();
	$('#but-submit').hide();
	$('.opt').live('click', function(event){
		var change_state = $(this).prev().attr('id');
		   
		 if(input_type =="checkbox"){
		   
			  if($("#"+change_state).hasClass(unchecked_class)){
				   $("#"+change_state).removeClass(unchecked_class).addClass(checked_class).addClass("done");
			  }else{
				   $("#"+change_state).removeClass(checked_class).addClass(unchecked_class).removeClass("done");;
			  }
			  setcheck = 1;
		 }else if(input_type =="radio"){
			   $('.input_opt').each(function(){$(this).removeClass(checked_class).addClass(unchecked_class);});
			   $("#"+change_state).removeClass(unchecked_class).addClass(checked_class).addClass("done");
			   setcheck = 0;
		 }
		 
		 totalchecked = $('.done').length;
		 
		 if(totalchecked >= 1){
			 $('#but-submit').show();
			 $('#but-submit').removeClass('inactive').addClass('active');
			 $('#but-submit').attr('disabled',false);
			 
		 }else{
			 $('#but-submit').hide();
			// $('#but-submit').attr('disabled',true);
		 }	
	});
	
	$('.input_opt').live('click', function(event){
      $(this).next().trigger('click');
    });
   
    $('.option_txt').live('click', function(event){
      $(this).prev().trigger('click');
    });
	
	$('#but-submit').click(function(){
	
		if(!$(this).hasClass('inactive')){
			attempt++;
			if(questionObj.cyu_type == "mcq"){
			
				var selected_value = parseInt($('.opt').filter(':checked').attr('value'));
				flag = selected_value == questionObj.Answer ? 1 : 0; 
				
			}else{
				var selectedValues = [];
				var correctValues = [];
				 $(':checkbox:checked').each(function(i){
					selectedValues[i] = $(this).val();
				 });
				correctValues = (questionObj.Answer).split(",");
				 flag = $(selectedValues).not(correctValues).length == 0 && $(correctValues).not(selectedValues).length == 0 ? 1 : 0;
			}
			
			var message = flag == 1 ? questionObj.correct : questionObj.incorrect;
			$("#feed-title").html('Feedback');
			if(flag == 1){
				$('#screen_feedback').html(message);
				$(this).hide();
				showAnswer();
				attempt > 1 ? parent.setScore(.5) : parent.setScore(1);
				
				
			}else{
				if(attempt > 1){
					
					$(this).hide();
					//instruction = questionObj.cyu_type == "mcq" ? "Correct answer is displayed." : "Correct answers are displayed.";
					$('#screen_feedback').html(message);
					showAnswer();
					parent.setScore(0);
					
				}else{
					instruction = "Click Close button to Try again.";
					message = 'Not quite!' + " " + instruction;
					$('#message').html(message);
					$("#feedbox, #int_dis").show();
				}
				$('#but-submit').hide();
				// $('#but-submit').removeClass('active').addClass('inactive');
				// $('#but-submit').attr('disabled',true);
				 
			}
			
		}
	});
	$('#but-next').click(function(){
		parent.$('#next').click();
	});
	$("#feed-close").click(function(){
		$("#feedbox,#int_dis").hide();
		if(attempt == 1 && flag == 0){
			$("#Options").html("");
			parseXML(xmlObj);
		}
	});
	
	
		
});

function showAnswer(){
	if(parent.lastPage) {
		$('#screen_feedback').show();
	}else {
		$('#but-next, #screen_feedback').show();
	}
	
	$("#Options").html("");
	parseXML(xmlObj);
	$('.opt').each(function(){
		$(this).attr('disabled',true);
	});
	$(".option_txt, .input_opt").css("cursor","default");
	$(".cyu_true").show();
	$('#but-submit').removeClass('active').addClass('inactive');
	$('#but-submit').attr('disabled',true);
}
function parseXML(xml){
	xmlObj = xml;
	questionObj.cyu_type = $(xml).find("assessment").attr('questionType').toLowerCase();
	
	questionObj.question = $(xml).find("question").text();
	questionObj.correct	= $(xml).find("correct").text();
	questionObj.incorrect = $(xml).find("incorrect").text();
	
	
	$('#pagetitle').html("<div class='qtxt'>" + questionObj.question + "</div>");
	
	if(questionObj.cyu_type == "mmcq"){
	     checked_class = "checkbox_selected";
	     unchecked_class = "checkbox_unselected";
		 input_type="checkbox";
		 questionObj.Answer = $(xml).find("assessment").attr('Answer');
	}else if(questionObj.cyu_type == "mcq"){
	     checked_class = "radio_selected";
	     unchecked_class = "radio_unselected";
		 input_type="radio";
		 questionObj.Answer = parseInt($(xml).find("assessment").attr('Answer'));
	} 
	
	$(xml).find("options").each(function(index){
		optionArray[index] = $(this).text();
		if(questionObj.cyu_type == "mmcq"){
			append_validation = questionObj.Answer.indexOf(index + 1) != -1 ? "true" : "false";
		}else{
			append_validation = parseInt(index + 1) == questionObj.Answer ? "true" : "false";
		}
		$("#Options").append("<div class='assessment_option'><div class='checkbox_unchecked '><div id='tick" + index + "' class='tick cyu_"+append_validation+"'></div><div id='input_image_"+index+"' class='input_opt "+unchecked_class+"'></div><input name='optionsGroup' type='"+input_type+"' value='" + (index+1) + "' class='opt chk_box' ref='"+append_validation+"' /><span class='option_txt' style='cursor:pointer;'>" + $(this).text() + "</span></div></div>");
	});
	questionObj.options = optionArray;
	
	
	
	
			
	//console.log(questionObj);
}