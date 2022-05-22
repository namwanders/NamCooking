$(function(){
    $('.login-input').change(function(){
        if (this.value === ""){
            $(this.parentNode.parentNode).find('.login-check').css('visibility', 'hidden');
        } else {
            $(this.parentNode.parentNode).find('.login-check').css('visibility', 'visible');
        }
    });
    $('.signup-input').change(function(){
        if (this.value === ""){
            $(this.parentNode.parentNode).find(".signup-check").css("visibility", "hidden");
        } else {
            $(this.parentNode.parentNode).find(".signup-check").css("visibility", "visible");
        }
    });
});