/**
 * @author 1020450921@qq.com
 * @link http://www.cnblogs.com/phillyx
 * @link http://ask.dcloud.net.cn/people/%E5%B0%8F%E4%BA%91%E8%8F%9C
 */
var imageTool = (function(mui, com) {
	/**
	 * 1.使用native.js压缩
	 * 1.1.拍照上传
	 * 1.2.选择图片上传
	 */
	var endReturn = [];
	var itool = {
		options: {
			uploadUrl: 'http://192.168.1.3:8081/subversion-wx/upload', //图片上传地址
			multiple: true, //是否多图上传
			maxPicsCount: 2, //默认一次最多选择9张图片
			isZoom: true, //默认通过native.js压缩
			ZoomBox: 1200, //缩放宽高，默认1200px,横图缩放宽度，高度根据比例计算，同理竖图
			ZoomQuality: 89, //压缩图片的质量
			isUpload: true, //默认不上传
			system: false, //设置为true时，如果系统自带相册选择控件时则优先使用，否则使用5+统一相册选择控件；设置为false则不使用系统自带相册选择控件，直接使用5+统一相册选择界面。
		},
		setUploadData: function(task) {
			task.addData("client", "HelloH5+");
			task.addData("uid", com.getUid());
		}
	};
	/**
	 * @description get images from an album
	 * @param {Object} cb(err,files)
	 */
	function galleryImgs(cb) {
		//重置
		endReturn = [];
		plus.gallery.pick(function(e) {
			if(itool.options.multiple) {
				/*if(e.files.length > itool.options.maxPicsCount){
					return cb && cb('最多选择'+itool.options.maxPicsCount+'张图片');
				}*/
			}
			processing_imgs(itool.options.multiple ? e.files : e, cb);
		}, function(error) {
			sys_permission(error);
			cb && cb(error.message);
		}, {
			filter: "image",
			multiple: itool.options.multiple,
			maximum: itool.options.maxPicsCount,
			system: false,
			onmaxed: function() {
				mui.toast('最多选择' + itool.options.maxPicsCount + '张图片');
			}
		});
	};

	var endReturn = [];

	function processing_imgs(files, cb) {
		plus.nativeUI.closeWaiting();
		plus.nativeUI.showWaiting('图片处理中，请耐心等待...');
		if(typeof(files) === "string") {
			files = [files];
		}
//		//files[1]
//		console.log("图片列表:" + JSON.stringify(files));
//		//ADD 添加的显示方法
//		//添加前清除和保存+图片
//		//保存
//		addimageslist = $("#addimageslist").html();
//		//清除
//		//$("#addimageslist").html("");
//		//清除新添加的所有图片但不删除+号有事件的图片
//		$("img").remove(".addimagess");
//		for(var i = 0; i < files.length; i++) {
//			tiganStr = $("#radio-img").html();
//			//替换相关的字段值 
//			tiganStr = del_html_tags(tiganStr, "{{imgsrclist}}", files[i]); //添加题目内容 
//
//			$('#addimageslist').prepend(tiganStr); //替换之后追加到选项中去(之前内容前)
//		}
		//console.log("原内容:"+addimageslist);
		//添加
		//$("#addimageslist").append(addimageslist);
		//
		com.myasync(files, processing_img, function() {
			plus.nativeUI.closeWaiting();
			//end
			console.log("end");
			console.log(endReturn)
			cb && cb(false, endReturn);
		});
	};
	/**
	 * @description 压缩并上传图片单独拎出来，拍照也可用到
	 * @param {Object} pic
	 * @param {Object} next
	 */
	function processing_img(pic, next) {
		console.log("选择的图片地址：" + pic);
		if(pic) {
			//是否需要压缩
			if(itool.options.isZoom) {
				zoomImage(pic, function(err, p) {
					processing_img_x(p, next);
				});
			} else {
				processing_img_x(pic, next);
			}
		}
	};
	//压缩后来到上传
	function processing_img_x(pic, next) {
		if(itool.options.isUpload) {
			imgUploadCom(pic, function(err, imgUrl) {
				endReturn.push({
					error: err,
					imgUrl: imgUrl
				});
				next();
			});
		} else {
			endReturn.push({
				imgUrl: pic
			});
			next();
		}
	}
	/**
	 * @description 上传图片带参数 
	 * @param {Object} path
	 * @param {Object} cb
	 */
	function imgUploadCom(path, cb) {
		var uploadUrl = itool.options.uploadUrl;
		console.log("上传前的文件路径：" + path);
		var task = plus.uploader.createUpload(uploadUrl, {
			method: "POST",
			timeout: 100,
			blocksize:204800,
			priority:100,
			headers: {"Content-Type": "multipart/form-data"}
		}, function(t, status) {
			//返回数据即关闭
			plus.nativeUI.closeWaiting();
			if(status == 200) {
				var str = JSON.stringify(t);
				var str1 = JSON.parse(str);
				var str2 = JSON.stringify(str1);
				console.log("上传图片返回的数据：" + str2);
				//var data = JSON.parse(t.responseText);
				//上传成功后后台返回的数据格式规范为{code:200,url:'网络链接'}
				
				// plus.uploader.clear(5);  
				if(str2.indexOf("code") != -1) {
					cb && cb(str1.message);
					
					if (str2.indexOf("maximum") != -1) {
						mui.toast("图片过大！上传失败！");
					} else{
						mui.toast("上传失败！");
					}
				} else {
					imgurl = str1.responseText;
					cb && cb(false, imgurl);
					//mui.toast(t.responseText);
				}
			} else {
				cb && cb('上传失败！');
			}
		});
		
		task.addFile(path, {
			key: "file" 
		});
		task.addData( "string_key"+com.getUid(), "string_value" );  
		
		itool.setUploadData(task);
		task.start();
		//task.close();
	}
	/**
	 * @description 缩放图片
	 * @param {Object} pth 图片本地路径
	 * @param {Object} cb 
	 */
	function zoomImage(pth, cb) {
		//不覆盖原图
		var newImgSrc = "_downloads/" + (+new Date()) + pth.substr(pth.lastIndexOf('.'));
		var conf = {
			src: pth,
			dst: newImgSrc,
			//dst:pth,
			//overwrite:true,
			quality: itool.options.ZoomQuality
		};
		//不再判断横图和竖图
		conf['width'] = itool.options.ZoomBox + 'px';
		plus.zip.compressImage(conf, function(data) {
			cb(false, data.target);
		}, function(err) {
			cb(err.message, pth);
		});
	};
	/**
	 * @description 手机拍照并压缩(上传)
	 * @param {Object} cb(err,files)
	 * @param {Object} err
	 */
	function camera(cb) {
		//重置 拍照无用，重置不要占内存
		endReturn = [];
		var cmr = plus.camera.getCamera();
		cmr.captureImage(function(p) {
			plus.io.resolveLocalFileSystemURL(p, function(entry) {
				//妈蛋 entry.fullPath 有坑，在ios上获取不到
				var u = entry.toLocalURL();
				console.log("entry.toLocalURL: " + u);
				processing_imgs(u, cb);
			}, function(err) {
				console.log("读取拍照文件错误：" + err.message);
				cb && cb(err.message);
			});
		}, function(err) {
			//未测拍照权限 err.code
			console.log("失败：" + err.message);
			cb && cb(err.message);
		}, {
			filename: "_doc/camera/",
			index: 1
		});
	};

	/**
	 * @description 打开相册失败，请求系统权限
	 * @param {Error} e
	 */
	function sys_permission(e) {
		if(plus.os.name == "iOS") {
			if(e.code == 8) {
				mui.alert("您的相册权限未打开，请在当前应用设置-隐私-相册来开打次权限", function() {
					plus.runtime.openURL('prefs:root=Privacy');
				})
			}
		} else if(plus.os.name == "Android") {
			if(e.code != 12) {
				mui.alert("您的相册权限未打开，请在应用列表中找到您的程序，将您的权限打开", function() {
					var android = plus.android.importClass('com.android.settings');
					var main = plus.android.runtimeMainActivity();
					var Intent = plus.android.importClass("android.content.Intent");
					var mIntent = new Intent('android.settings.APPLICATION_SETTINGS');
					main.startActivity(mIntent);
				});
			}
		}
	};
	itool.galleryImgs = galleryImgs;
	itool.imgUpload = imgUploadCom;
	itool.zoomImage = zoomImage;
	itool.camera = camera;
	return itool;
})(mui, common);

