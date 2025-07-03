# ByPass
因为学校在网站加ssl壳的时候把put/delete请求拦截了，所以写了这个绕过
## 使用方法
将front.js插入前端代码

将back扔到后端nginx做反代即可
## 原理
通过js脚本拦截put/delete请求，将请求方法改为post。在标头加上x-http-method-override，参数为PUT或者DELETE以给后端nginx标记原请求方法。在后端nginx对请求进行还原。完成绕过。
