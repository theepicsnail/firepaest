firebase.initializeApp({
    apiKey: "AIzaSyAr_DCLMmlHYlCTbS5_9Ioiex6q9EY0-1g",
    authDomain: "firepaste-71d3b.firebaseapp.com",
    databaseURL: "https://firepaste-71d3b.firebaseio.com",
    projectId: "firepaste-71d3b",
    storageBucket: "firepaste-71d3b.appspot.com",
    messagingSenderId: "754135541208"
});


const DB = firebase.database();
const AUTH = firebase.auth();

function setupEditor(state) {
    console.log(state);
    const editor = ace.edit("editor");
    // Kill off ctrl-s.
    document.body.addEventListener("keydown", (evt) => { if (evt.ctrlKey && evt.keyCode == 83) return evt.preventDefault(); });

    editor.getSession().setUseWorker(false);
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    state.editor = editor;
    return Promise.resolve(state);
}

function setupControls(state) {

    const selector = document.getElementById("mode");
    selector.onchange = () => {
        state.editor.getSession().setMode("ace/mode/" + selector.value);
    };

    const languages = ["abap", "actionscript", "ada", "asciidoc", "assembly_x86", "autohotkey", "batchfile", "c9search", "c_cpp", "clojure", "cobol", "coffee", "coldfusion", "csharp", "css", "curly", "d", "dart", "diff", "django", "dot", "ejs", "erlang", "forth", "ftl", "glsl", "golang", "groovy", "haml", "handlebars", "haskell", "haxe", "html", "html_ruby", "ini", "jade", "java", "javascript", "json", "jsoniq", "jsp", "jsx", "julia", "latex", "less", "liquid", "lisp", "livescript", "logiql", "lsl", "lua", "luapage", "lucene", "makefile", "markdown", "matlab", "mushcode", "mushcode_high_rules", "mysql", "objectivec", "ocaml", "pascal", "perl", "pgsql", "php", "powershell", "prolog", "properties", "python", "r", "rdoc", "rhtml", "ruby", "rust", "sass", "scad", "scala", "scheme", "scss", "sh", "snippets", "sql", "stylus", "svg", "tcl", "tex", "text", "textile", "toml", "twig", "typescript", "vbscript", "velocity", "verilog", "xml", "xquery", "yaml"];
    languages.forEach((lang) => {
        const opt = document.createElement("option");
        opt.value = lang;
        opt.text = lang;
        opt.selected = lang == "javascript";
        selector.appendChild(opt);
    });
    return Promise.resolve(state);
}


const setupFirebase = (editor) => new Promise((accept) => {
    AUTH.onAuthStateChanged(function (user) {
        state.user = user;
        if (user === null)
            AUTH.signInAnonymously();
        else
            accept(state);
    });
});


const setupPaest = (state) => new Promise((accept) => {

    let paestId;

    function newPaest() {
        paestId = DB.ref('paests').push({
            text: "",
            author: state.user.uid
        }).key;
        window.location.hash = paestId;
        state.paestId = paestId;
    }

    paestId = window.location.hash.substr(1);
    state.paestId = paestId;
    if (paestId.length == 0) {
        newPaest();
    } else {
        DB.ref('paests').child(paestId).once('value', (response) => {
            console.log(response.val());
            if (response.val() === null) newPaest();
            else {
                accept(state);
            }
        });
    }
});

const setupAutosave = (state) => new Promise((accept) => {
    let savingTimer = 0;
    state.editor.on('input', () => {
        clearTimeout(savingTimer);
        savingTimer = setTimeout(() => {
            DB.ref('paests').child(state.paestId).set({
                author: state.user.uid,
                text: state.editor.getValue()
            })
        }, 1000);
    });
});



const state = {};
Promise.resolve(state)
    .then(setupEditor)
    .then(setupControls)
    .then(setupFirebase)
    .then(setupPaest)
    .then(setupAutosave);