/**
 * Created by wangzhiwei on 16/7/11.
 */
var URLBASE="../../laikanxing_v1/supportactivity/";
var ACTIVITYID=wzw.getUrlParam('id',location.href);
var TOKEN;
var LASTSUPPORTIMAGEID=0;
/**
 * 剩余问题:文件下载,查看大图点赞
 */
function loadHtml(){
    $(function(){
        currentProjectFunction.initEvent();
      if(wzw.isLogin()){//是否登录
          TOKEN=$.cookie('token');
      }else{
          currentProjectFunction.showLoginBtn();
          TOKEN=null;
      }
    currentProjectFunction.getSupportActivity(ACTIVITYID);//获取活动数据
    currentProjectFunction.getActivityHotImg(ACTIVITYID);//获取用户上传图片
    currentProjectFunction.initCamera(ACTIVITYID,TOKEN);//初始化上传按钮
      if(!wzw.isLocal()){
          $('footer').show();//尾巴下载
      }
      if(wzw.isLogin() && !wzw.isLocal() && !wzw.browser.versions.weixin && !wzw.browser.isIOSView && !wzw.browser.androidView){//不是微信,不是来看星app,并且登录
          $('header .login-share .logout').show().on('click',function(){
              logoutCallBack();
          });//退出按钮
      }
    });
}
var currentProjectFunction={
    getSupportActivity:function(activityId){//获取活动数据
            $.ajax({
                url:URLBASE+'get/'+activityId,
                contentType: "application/json",
                type: "GET",
                dataType: "json",
                timeout: 100000,
                headers:{"FanShowAuth":TOKEN},
                success: function (data, status) {
                    currentProjectFunction.appendActivityData(data);
                },
                error: function (xhr, status, error) {
                    if (xhr.status == 403) {
                        console.log(403);
                    } else {
                        console.log(xhr.status);
                    }
                }
            });
    },
    getActivityImg:function(activityId,lastId){//获取活动图片
        $.ajax({
            url:URLBASE+'image/get/'+activityId+'/'+lastId,
            contentType: "application/json",
            type: "GET",
            dataType: "json",
            timeout: 100000,
            headers:{"FanShowAuth":TOKEN},
            success: function (data, status) {
                if(data.length==0){//没有数据
                    toast('没有了更多了~');
                }else{
                    var options=data;
                    options.sort(wzw.asc('id'));
                    currentProjectFunction.appendImgOption(options);
                    LASTSUPPORTIMAGEID=options[options.length-1].id;
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status == 403) {
                    console.log(403);
                } else {
                    if(xhr.status==200){
                        toast('没有了更多了~');
                    }
                    console.log(xhr.status);
                }
            }
        });
    },
    getActivityHotImg:function(activityId){
        $.ajax({
            url:URLBASE+'image/hot/'+activityId,
            contentType: "application/json",
            type: "GET",
            dataType: "json",
            timeout: 100000,
            headers:{"FanShowAuth":TOKEN},
            success: function (data, status) {
                var options=data;
                options.sort(wzw.sort('praise'));
                currentProjectFunction.appendImgOption(options);
                for(var index in data){
                    $('#clone'+data[index].id).append('<img src="../img/hot.png" alt="" class="hot"/>');
                }
                currentProjectFunction.getActivityImg(ACTIVITYID,LASTSUPPORTIMAGEID);//获取用户上传图片
                $(window).scroll(function(){
                    var scrollTop = $(this).scrollTop();
                    var scrollHeight = $(document).height();
                    var windowHeight = $(this).height();
                    if(scrollTop + windowHeight == scrollHeight){//底部加载数据
                        //toast('拼命加载中...');
                        currentProjectFunction.getActivityImg(ACTIVITYID,LASTSUPPORTIMAGEID);//获取用户上传图片
                        $(this).scrollTop($(this).scrollTop()-1);
                    }
                });
            },
            error: function (xhr, status, error) {
                if (xhr.status == 403) {
                    console.log(403);
                } else {
                    console.log(xhr.status);
                }
            }
        });
    },
    appendActivityData:function(data){//追加数据
        $('header').css('background-image','url("'+data.imgUrl+'")');
        $('.activity-detail .detail-content').text(data.detail);
    },
    appendImgOption:function(data){
        var options=data;
        for(var index in options){
            var option=options[index];
            if($('#clone'+option.id).length>=1){//重复数据,直接跳过
                continue;
            }
            var clone=$($('#clone').clone());
            clone.attr('id','clone'+option.id).attr('data-id',option.id).attr('data-name',option.userName);
            $('.img-box').append(clone);
            clone.find('.img').attr('src',option.imgUrl+'@200h_200w_1e_1c').attr('data-src',option.imgUrl).on('click',currentProjectFunction.initBigImageData);
            if(option.praise!=0){
                clone.find('.praise .nmb').text(option.praise);
            }
            if(!option.userPraise){//赞按钮
                clone.find('.praise img')
                    .addClass('add-praise')
                    .attr('src','../img/no-praise.png')
                    .attr('data-value',option.id);
                var praise=clone.find('.add-praise');//点赞按钮
                praise.one('click',function(){//点赞
                    currentProjectFunction.userPraise(ACTIVITYID,$(this).attr('data-value'),TOKEN,$(this));
                });
            }else{
                clone.find('.praise img')
                    .addClass('remove-praise')
                    .attr('data-value',option.id)
                    .attr('src','../img/praise.png');
                var praise=clone.find('.remove-praise');
                praise.one('click',function(){//取消赞事件
                    currentProjectFunction.removeUserPraise(ACTIVITYID,$(this).attr('data-value'),TOKEN,$(this));
                });
            }


        }

    },
    showLoginBtn:function(){
        $('.login-share .login').show();//登录按钮显示
    },
    userPraiseCss:function(activityId,imgId,token,ele){
        var nmb=$(ele.parent()).find('.nmb');
        nmb.text(Number(nmb.text())+1);
        ele.attr('src','../img/praise.png');
        ele.removeClass('add-praise').addClass('remove-praise');//切换按钮状态
        ele.one('click',function(){//取消赞事件
            currentProjectFunction.removeUserPraise(activityId,imgId,token,ele);
        });
    },
    userPraise:function(activityId,imgId,token,ele){
        if(!wzw.isLogin()){//是否已经登录
            showLoginDiv();
            return false;
        }
        $.ajax({
            url:URLBASE+'praise/up/',
            contentType: "application/json",
            type: "POST",
            dataType: "json",
            data:JSON.stringify({"activityId":activityId,"imgId":imgId}),
            timeout: 100000,
            headers:{"FanShowAuth":token},
            success: function (data, status) {
                currentProjectFunction.userPraiseCss(activityId,imgId,token,ele);
                _CZC_LOCAL.addPraiseSuccess();//数据统计
            },
            error: function (xhr, status, error) {
                if (xhr.status == 403) {
                    console.log(403);
                } else {
                    console.log(xhr.status);
                }
            }
        });
        return true;
    },
    removeUserPraiseCss:function(activityId,imgId,token,ele){//页面交互事件
        var nmb=$(ele.parent()).find('.nmb');
        var result=Number(nmb.text())-1;
        if(result==0){
            nmb.text('');
        }else{
            nmb.text(result);
        }
        ele.attr('src','../img/no-praise.png');
        ele.removeClass('remove-praise').addClass('add-praise');//切换按钮状态
        ele.one('click',function(){//用户点赞事件
            currentProjectFunction.userPraise(ACTIVITYID,$(this).attr('data-value'),TOKEN,$(this));
        })
    },
    removeUserPraise:function(activityId,imgId,token,ele){//服务器交互事件
        if(!wzw.isLogin()){
            showLoginDiv();
            return false;
        }
        $.ajax({
            url:URLBASE+'praise/down/',
            contentType: "application/json",
            type: "PUT",
            dataType: "json",
            data:JSON.stringify({"activityId":activityId,"imgId":imgId}),
            timeout: 100000,
            headers:{"FanShowAuth":token},
            success: function (data, status) {
                currentProjectFunction.removeUserPraiseCss(activityId,imgId,token,ele);
                _CZC_LOCAL.deletePraiseSuccess();//数据统计
            },
            error: function (xhr, status, error) {
                if (xhr.status == 403) {
                    console.log(403);
                } else {
                    console.log(xhr.status);
                }
            }
        });
        return true;
    },
    initCamera:function(activityId,token){
        $("input[type='file']").fileupload({
            url:"../../laikanxing_v1/resource/create",
            headers:{"FanShowAuth":$.cookie("token")},
            sequentialUploads: true,
            add: function (e, data) {
                    alertDivShow($('.upload-img'));
                     var reader = new FileReader();
                    reader.readAsDataURL(data.files[0]);
                    reader.onload=function(e){
                        $('.upload-img .img-source').attr('src',this.result);
                    };

                    $('.upload-img .footer .upload-btn').click(function () {
                        data.submit();
                        alertDivHide($('.upload-img'));
                    });
            },
            done:function(e,result){
                if (result.result.resourceID>0) {
                    $.ajax({//上传图片
                        url:URLBASE+'image/create/',
                        contentType: "application/json",
                        type: "POST",
                        dataType: "json",
                        timeout: 100000,
                        headers:{"FanShowAuth":token},
                        data:JSON.stringify({"activityId":activityId,"imgId":result.result.resourceID}),
                        success: function (data, status) {
                            toast('图片上传成功!');
                        },
                        error: function (xhr, status, error) {
                            if (xhr.status == 403) {
                                console.log(403);
                            } else {
                                console.log(xhr.status);
                            }
                        }
                    });
                }else{
                    toast('上传失败,请重试!');
                }
            },
            fail:function(e, data) {
                if (data.errorThrown=="Forbidden") {
                    toast('请登陆!');
                }
            }
        });
        $('label').on('click',function(){
            if(!wzw.isLogin()){//是否已经登录
                showLoginDiv();
            }else{
                $("input[type='file']").trigger("click");
            }

        });
    },
    initBigImageData:function(){//查看大图
            var parent=$($(this).parent());
            var clickPraiseImage=parent.find('.praise img');//点赞按钮
            var currentPraiseImage=$('.alert-img .footer img');//弹层点赞按钮
            var name=parent.attr('data-name');
            var imgId=parent.attr('data-id');
            var praiseFlag=clickPraiseImage.attr('class');
            var praiseNmb=parent.find('.praise .nmb').text();
            $('.alert-img .footer .user').text('发布人:'+name);
            $('.alert-img .footer .nmb').text(praiseNmb);
            currentPraiseImage.attr('src',clickPraiseImage.attr('src'));
            currentPraiseImage.unbind( "click" );//防止重复点击
            if(praiseFlag=='remove-praise'){//修改原点击图片赞的状态
                currentPraiseImage.one('click',function(){
                    var flag=//是否登录
                        currentProjectFunction.removeUserPraise(ACTIVITYID,imgId,TOKEN,$(this));//this:弹层中点赞按钮
                    if(flag){
                        clickPraiseImage.unbind('click');
                        currentProjectFunction.removeUserPraiseCss(ACTIVITYID,imgId,TOKEN,clickPraiseImage);//修改图片列表的点赞按钮状态
                    }else{
                        alertDivHide($('.alert-img'));
                    }
                });
            }else{
                currentPraiseImage.one('click',function(){
                    var flag=//是否登录
                    currentProjectFunction.userPraise(ACTIVITYID,imgId,TOKEN,$(this));
                    if(flag){
                        clickPraiseImage.unbind('click');
                        currentProjectFunction.userPraiseCss(ACTIVITYID,imgId,TOKEN,clickPraiseImage);
                    }else{
                        alertDivHide($('.alert-img'));
                    }
                });
            }
        alertDivShow($('.alert-img'));
        $('.alert-img').find('.big-image')
            .attr('src',$(this).attr('data-src'));//显示图片
            //$('.alert-img .header a').attr('href',$(this).attr('src'));//下载图片
    },
    initEvent:function(){
        $('.header .back').on('click',function(){
            alertDivHide($('.'+$(this).attr('data-div')));
        });
        $('.detail-btn').on('click',function(){
            alertDivShow($('.activity-detail'));
        });
        //$('.alert-img').on('click',function(){
        //    $(this).hide();
        //});
    }
};
function loginCallBak(){
    _CZC_LOCAL.loginSuccess();//统计登录成功
    location.reload();
}
function logoutCallBack(){
    $.cookie("token", null, { path: '/' });
    $.cookie("userId", null, { path: '/' });
    _CZC_LOCAL.logoutSuccess();//数据统计
    location.reload();
}
function showLoginDiv(){
    $('.login-share .login').click();
}
function toast(text){
    $('.toast').html(text).show().fadeOut(2000);
}
function showAlertDivBack(){
 $('body').css('overflow','hidden').css('position','fixed');
}
function hideAlertDivBack(){
 $('body').css('overflow','scroll').css('position','relative');
}
function alertDivHide(ele){
    ele.hide();
    hideAlertDivBack();
}
function alertDivShow(ele){
    ele.show();
    showAlertDivBack();
    return ele;
}