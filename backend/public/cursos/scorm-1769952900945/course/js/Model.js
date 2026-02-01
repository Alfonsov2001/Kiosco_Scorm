var lastPage = false;
$(document).ready(function(){
	
	$('#container').hide();
	$('#download').tipsy({gravity: 's'});
	
	
	var height = ($(document).height()*75)/100;
	$('#coursemap').height(height);
	$('#searchContainer').height(height);
	$("#content").height(($(document).height()*80)/100);
	
	var interfacesButtons = ['coursemapbtn', 'Search_txt', 'search_btn', 'back', 'next', 'download', 'closeBtn'];
	
	var mode;
	mode = Utils.urlQueryString("type",document.location.search);
	
	if(mode == null){
		mode = "wbt";
	}
	var framework = new Framework(mode);
	

	$(window).bind('orientationchange', function(){
		
		window.setTimeout(function() {
			var height = ($(window).height()*75)/100;
			$('#coursemap').height(height);
			$('#searchContainer').height(height);
			$("#content").height(height);
			$("#ContentFrame").height($('#player').height());
			$("#ContentFrame").css('height', $('#player').height() + 'px');
			
			
			var percentage = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*$('#progress').width();
			$('#fill').width(percentage);
			var percentageText = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*100;
			$('#progressTxt').text(Math.ceil(percentageText) +"%");
		}, 500);
		
		//$("#content").height(($(window).height()*75)/100);	*/
	});
	
	$( window ).resize(function() {
		window.setTimeout(function() {
			
			var height = ($(window).height()*75)/100;
			console.log("Content Height :: " + height);
			$('#coursemap').height(height);
			$('#searchContainer').height(height);
			$("#content").height(height);
			$("#ContentFrame").height($('#player').height());
			$("#ContentFrame").css('height', $('#player').height() + 'px');
			
			
			var percentage = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*$('#progress').width();
			$('#fill').width(percentage);
			var percentageText = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*100;
			$('#progressTxt').text(Math.ceil(percentageText) +"%");
		}, 100);
	});
	
	$(window).bind('beforeunload', function () {
		Navigation.exit();
		 window.opener.hide();
	});
	
	$(document).keypress(function(event) {
		if(event.keyCode == 13){
			$(document.activeElement).click();	
		}
	});
	
	function changeButtonTabOrder(start, tabIndex){
		for(i=start;i<interfacesButtons.length;i++){
			$('#'+interfacesButtons[i]).attr('tabIndex', ++tabIndex);
		}
	}
	
	function sendFeedback (arg) {

		//var StudentName = "sample";
		//var StudentID = "sample"
		var feedbackObject = {"courseId" : courseId, "reseller" : resellerName, "id" : StudentID, "name": StudentName, "moduleId" : (praseInt(Framework.currentIndex) + 1) , "moduleName" : Framework.courseArray[Framework.currentIndex].displayText, "feedback" : arg};
		$.ajax({
			type: "POST",
			url: feedbackApi,
			data: JSON.stringify(feedbackObject),
			contentType: "application/json; charset=utf-8",
			success: function() { $(".alert").show(); setTimeout(function(){ $(".alert").hide(); }, 2000);  }
		});
	}
	$('#happybtn').click(function(){
		sendFeedback('good');
	});
	
	$('#sadbtn').click(function(){
		sendFeedback('bad');
	});
	//alert(mode);
	$('#coursemapbtn').click(function(){
		//$("#coursemap").jScrollPaneRemove();
		//$('#coursemap').height(($('#content').height()*90)/100);
		$('#searchContainer').hide();
		var totalPages = $('.link').length;
		if(!$(this).hasClass('active')){
			$(this).addClass('active');
			$('.link').each(function(i) { 
				$(this).attr("tabIndex",(2+i));
			});
			changeButtonTabOrder(1, totalPages+1);
		}else{
			$(this).removeClass('active');
			changeButtonTabOrder(1, 1);
		}
		$('#coursemapContainer').slideToggle();
		//$("#coursemap").jScrollPane({showArrows:true, scrollbarWidth: 15, arrowSize: 12}).addTouch();
		//$('.jScrollPaneDrag').addTouch();
	
	});
		
	$('#back').click(function(){
	
		if(!$(this).hasClass('disable')){
			if(Framework.currentIndex > 0){
				Framework.currentIndex--;
				$('#'+Framework.currentIndex).click();
			}
		}
	});
	
	$('#next').click(function(){
		if(!$(this).hasClass('disable')){
			if(Framework.courseArray.length > Framework.currentIndex-1){
				Framework.currentIndex++;
				$('#'+Framework.currentIndex).click();			
			}
		}
	});
	
	$('#Search_txt').focus(function() {
		$(this).val("");
	});
	
	$("#Search_txt").keyup(function(event){
		if(event.keyCode == 13){
			$("#search_btn").click();
		}
	});
	
	$('#search_btn').click(function(){
		var cnt = 0;
		var searchText = $('#Search_txt').val().toLowerCase();
		$('#searchLinkHolder').html("");
		$('#coursemapContainer').hide();
		for(i=0;i<Framework.courseArray.length;i++){
			var tempText = Framework.courseArray[i].keywords.toLowerCase();
			if(tempText.indexOf(searchText) != -1){
				cnt++;
				var id = Framework.courseArray[i].id;
				var moduleTitle = Framework.courseArray[i].displayText.substr(0, Framework.courseArray[i].displayText.indexOf(':'));
				var text = Framework.courseArray[i].displayText.substr(Framework.courseArray[i].displayText.indexOf(':')+1, Framework.courseArray[i].displayText.length);
				$('#searchLinkHolder').append("<li id='search_" + id +"' value=" + id + " tabIndex='"+ (3+cnt)+"'><b>" + moduleTitle + "</b><br/>" + text + "</li>");
				
				$('#search_'+ id).click(function(){
					$('#'+$(this).attr('value')).click();
					$('#searchContainer').hide();
					//alert($(this).attr('value'));
					//loadContent($(this).attr('value'));
				});
			}
		}
		changeButtonTabOrder(3, 3+cnt+1);
		//$("#searchLinkHolder").jScrollPaneRemove();
		
		if(cnt == 0){
			$('#searchLinkHolder').html("<span class='noresult'>No result found.</span>");
		}
		$('#searchContainer').slideDown();
		//$("#searchLinkHolder").jScrollPane({showArrows:true, scrollbarWidth: 15, arrowSize: 12}).addTouch();
		//$('.jScrollPaneDrag').addTouch();
		
		
	});
	$('#searchClose').click(function(){
		$('#searchContainer').slideToggle();
		
	});
	
	$('#bookmark_ok').click(function(){
		$('#'+Framework.currentIndex).click();
		$('#disabler').hide();
		$('#bookmark_container').hide();
	});
	$('#bookmark_cancel').click(function(){
		$('#disabler').hide();
		$('#bookmark_container').hide();
		Framework.currentIndex = 0;
		$('#'+Framework.currentIndex).click();
	});
	$('#download').click(function(){
		window.open(downloadURL,'Download');
		
	});
	
	$('#cc_btn').click(function(){
		if($("#transcript").is(":visible")){
			$("#transcript").hide();
			$("#player").css('width', '99%');
		}else{
			$("#player").css('width', '70%');
			$("#transcript").show();
		}
	});
	
	$("#switch").click(function(){
		if($('#switch').is(':checked')){
			$("#transcriptContainer").hide();
			$("#player").css('width', '96%');
		}else{
			$("#transcriptContainer").show();
			$("#player").css('width', '70%');
		}
	});
	
	$('#closeBtn').click(function(){
		//window.close();
		//top.close();
		//window.open('', '_self', ''); 
		//window.top.close();
		top.close();
		//parent.window.close();
	});

});