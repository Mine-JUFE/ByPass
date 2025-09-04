# HTTP请求方法转换器

一个用于在浏览器中转换HTTP请求方法的JavaScript工具，特别适用于处理网络环境限制的情况。
因为我们皮肤站在学校域名下,在加上SSL时候将PUT/DELETE拦截所以写了这个代码.

## 功能概述

这个工具能够将特定的HTTP方法（如PUT、DELETE）转换为POST方法，同时在请求头中添加原始方法信息。配合Nginx配置，可以在服务器端正确还原原始HTTP方法。

## 主要特性

-  自动转换指定的HTTP方法（PUT、DELETE等转换为POST）
-  添加自定义头部标识原始方法
-  支持多种HTTP客户端（fetch、XHR、Axios、jQuery）
-  可配置转换规则和行为
-  详细的调试日志

## 安装与使用

### 前端集成

将front.js加入你的前端代码
比如:
```html
<script src="path/to/front.js"></script>
```

### Nginx配置

在您的Nginx配置中添加以下内容(记得做适应性修改)：

```nginx
# 映射HTTP方法覆盖头
map $http_x_http_method_override $override_method {
  default $http_x_http_method_override;
  ""      $request_method;
}

server {
  listen 80;
  server_name your-domain.com;
  
  location / {
    proxy_pass http://backend-service;
    proxy_method $override_method;
    proxy_set_header X-Original-Method $request_method;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 配置选项

```javascript
// 自定义配置示例
window.__requestTransformer.config = {
  debug: true, // 启用调试模式
  methodsToConvert: ['PUT', 'DELETE', 'PATCH'], // 要转换的方法
  overrideHeader: 'X-Method-Override', // 自定义头部字段
  redirectHandling: 'manual' // 重定向处理方式
};
```

## 适用场景

- 网络环境限制特定HTTP方法（如PUT、DELETE）

## 浏览器兼容性

支持所有现代浏览器，包括：
- Chrome 40+
- Firefox 34+
- Safari 10+
- Edge 12+

## 许可证

Apache License 2.0

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 支持

如有问题，请创建GitHub Issue联系。
