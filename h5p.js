var H5P = H5P || {};

H5P.MathEval = (function ($) {
  function C(options, id) {
    this.$ = $(this);
    this.options = $.extend(true, {}, {}, options);
    this.id = id;
    this.applet = undefined;
    this.data = h5p_get_data_obj(this.options.data);
  };
 
  C.prototype.attach = function ($container) {


    this.applet = new math_eval_wrapper("viewer");
    $container.append(this.applet.el);
    if (this.data === undefined) return;
    this.applet.data = this.data.data;
    
  };
 
  return C;
})(H5P.jQuery);