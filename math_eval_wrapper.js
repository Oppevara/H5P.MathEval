
function math_eval_wrapper(mode) {
	this.el = build("div");
	this.mode = mode || "editor";

	this.openEditor = function openEditor(textareaID) {
		var equation = document.querySelector("#" + textareaID).value;

		var vme_url = "";
		if (window.location.hostname == "localhost") {
			vme_url = "http://localhost:8888/geo5p/sites/all/modules/x_ck_math/ck_vme/VisualMathEditor/VisualMathEditor.html?runLocal";
		} else {
			vme_url = "/oppevara/sites/all/modules/x_ck_math/ck_vme/VisualMathEditor/VisualMathEditor.html?runLocal";
		}
		if (equation.length > 0) {
			var ltx_start = equation.indexOf("\\(");
			var ltx_end = equation.indexOf("\\)");
			if (ltx_start !== -1 && ltx_end !== -1) {
				//	is latex
				equation = equation.substring(ltx_start + 2, ltx_end);
			}
			vme_url += "&equation=" + equation;
		}

		var ifr = build("iframe");
		ifr.style.width = "100%";
		ifr.style.height = "100%";
		ifr.src=vme_url;
		var f = new floater(ifr, "Visual Math Editor", undefined, undefined, 800, 600);
		f.add_button("ok", function() {
			var cont = ifr.contentWindow.document.querySelector(".CodeMirror-lines");
			var conts = cont.querySelectorAll("pre");
			var latex = "";
			for (var i = 0; i < conts.length; i++) {
				latex += conts[i].innerText;
			}
			f.remove();
			document.querySelector("#" + textareaID).value = "\\(" + latex + "\\)";
		}.bind(this));
		f.add_button("cancel", function() { f.remove(); }.bind(this));
    }.bind(this);


	this.build_viewer = function() {
		this.el.style.display = "flex";
		this.el.style.padding = "5px";
		this.el.style.margin = "300px";

		var inp1 = build("textarea", undefined, this.el);
		var eq = build("div", undefined, this.el, "=");
		var inp2 = build("textarea", undefined, this.el);
		var butt = build("button", undefined, this.el, "Check");

		butt.addEventListener("click", function() {
			var dat1 = inp1.value;
			var dat2 = inp2.value;

			var equals = false;
			try {
				var equals = e_math.equals(dat1, dat2);
			} catch(ex) {}

			if (equals) {
				this.el.style.backgroundColor = "rgba(0,255,0,0.3)";
			} else {
				this.el.style.backgroundColor = "rgba(255,0,0,0.3)";
			}
		}.bind(this));

		var reset_func = function() {
			this.el.style.backgroundColor = "rgba(0,0,0,0)";
		}.bind(this);
		inp1.addEventListener("click", reset_func);
		inp2.addEventListener("click", reset_func);



		inp1.id = "inp1";
		inp1.addEventListener("click", function() {
			this.openEditor("inp1");
		}.bind(this));

		inp2.id = "inp2";
		inp2.addEventListener("click", function() {
			this.openEditor("inp2");
		}.bind(this));

	}.bind(this);

	if (this.mode == "editor") {
		//	not implemented
	} else {
		this.build_viewer();
	}


	Object.defineProperty(this, "data", {
		'get' : function() {
			if (this.mode == "editor") {
				//	not implemented
			} else {
				return this._data;
			}
		},
		'set' : function(v) {
			if (this.mode == "editor") {
				//	not implemented
			} else {
				this._data = v;
			}
		}
	});


}


