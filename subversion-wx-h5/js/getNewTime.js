function GetTime(){
   var date=new Date();
//JSON格式时间：2018-03-29T09:50:38.017Z
   var newtimes=date.toJSON();
   console.log('当前时间:'+newtimes);
 }