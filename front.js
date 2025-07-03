if (!window.__requestTransformer) {
  window.__requestTransformer = {
    // 配置
    config: {
      debug: false,
      methodsToConvert: ['PUT', 'DELETE'],
      overrideHeader: 'X-HTTP-Method-Override',
      redirectHandling: 'manual'
    },
    
    // 初始化方法
    init() {
      this.overrideFetch();
      this.overrideXHR();
      this.overrideCommonLibraries();
      
      if (this.config.debug) {
        console.log('[Request Transformer] Initialized');
      }
    },
    
    // 核心转换逻辑
    convertRequest(method, url, headers) {
      const originalMethod = method.toUpperCase();
      
      if (this.config.methodsToConvert.includes(originalMethod)) {
        if (this.config.debug) {
          console.log(`[Request Transformer] Converting ${originalMethod} to POST for ${url}`);
        }
        
        // 添加方法覆盖头
        headers.set(this.config.overrideHeader, originalMethod);
        return 'POST';
      }
      
      return originalMethod;
    },
    
    // 处理重定向
    handleRedirect(response, options) {
      if (response.redirected && response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        if (this.config.debug) {
          console.warn(`[Request Transformer] Handling redirect to ${location}`);
        }
        
        // 对于转换过的请求，保持为POST
        return fetch(location, {
          ...options,
          method: options._converted ? 'POST' : options.method
        });
      }
      return response;
    },
    
    // 覆盖原生 fetch
    overrideFetch() {
      if (window.__originalFetch) return;
      
      window.__originalFetch = window.fetch;
      
      window.fetch = async (resource, options = {}) => {
        try {
          // 准备请求参数
          const request = resource instanceof Request ? resource : new Request(resource, options);
          const headers = new Headers(request.headers);
          
          // 转换方法
          const newMethod = this.convertRequest(request.method, request.url, headers);
          const isConverted = newMethod !== request.method;
          
          // 创建新请求
          const newRequest = new Request(request, {
            method: newMethod,
            headers,
            redirect: this.config.redirectHandling
          });
          
          // 发送请求
          const response = await window.__originalFetch(newRequest);
          
          // 处理重定向
          if (isConverted) {
            return this.handleRedirect(response, {
              ...options,
              method: newMethod,
              headers,
              body: request.body,
              _converted: true
            });
          }
          
          return response;
        } catch (error) {
          if (this.config.debug) {
            console.error('[Request Transformer] Fetch error:', error);
          }
          throw error;
        }
      };
    },
    
    // 覆盖原生 XMLHttpRequest
    overrideXHR() {
      if (XMLHttpRequest.prototype.__originalOpen) return;
      
      XMLHttpRequest.prototype.__originalOpen = XMLHttpRequest.prototype.open;
      
      XMLHttpRequest.prototype.open = function(method, url) {
        // 存储原始方法
        this._requestTransformer = {
          originalMethod: method.toUpperCase(),
          url
        };
        
        // 应用转换
        const headers = {};
        const newMethod = window.__requestTransformer.convertRequest(
          method, 
          url, 
          {
            set: (key, value) => headers[key] = value,
            get: (key) => headers[key]
          }
        );
        
        // 调用原始方法
        this.__originalOpen.call(this, newMethod, url);
        
        // 存储自定义头
        this._requestTransformer.headers = headers;
      };
      
      XMLHttpRequest.prototype.__originalSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.send = function(data) {
        // 设置自定义头
        if (this._requestTransformer?.headers) {
          for (const [key, value] of Object.entries(this._requestTransformer.headers)) {
            this.setRequestHeader(key, value);
          }
        }
        
        this.__originalSend.call(this, data);
      };
    },
    
    // 覆盖常见库
    overrideCommonLibraries() {
      // Axios
      if (window.axios && !window.axios.__wrapped) {
        window.axios.__wrapped = true;
        
        const originalCreate = window.axios.create;
        window.axios.create = function(config) {
          const instance = originalCreate.call(this, config);
          
          instance.interceptors.request.use(config => {
            if (config.method && config.headers) {
              const newMethod = window.__requestTransformer.convertRequest(
                config.method,
                config.url,
                config.headers
              );
              
              if (newMethod !== config.method) {
                config.method = newMethod;
              }
            }
            return config;
          });
          
          return instance;
        };
      }
      
      // jQuery
      if (window.jQuery && !window.jQuery.ajax.__wrapped) {
        window.jQuery.ajax.__wrapped = true;
        
        const originalAjax = window.jQuery.ajax;
        
        window.jQuery.ajax = function(url, options) {
          if (typeof url === 'object') {
            options = url;
            url = undefined;
          }
          
          options = options || {};
          
          if (options.type && options.headers) {
            const headers = options.headers;
            const newMethod = window.__requestTransformer.convertRequest(
              options.type,
              options.url || url,
              {
                set: (k, v) => headers[k] = v,
                get: (k) => headers[k]
              }
            );
            
            if (newMethod !== options.type) {
              options.type = newMethod;
            }
          }
          
          return originalAjax.call(this, url, options);
        };
      }
    }
  };
  
  // 初始化
  window.__requestTransformer.init();
}
