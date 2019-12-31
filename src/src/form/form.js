var arraySort = require("../array/sort.js"),
    attach = require("../core/methods/attach.js"),
    dataFormat = require("../core/data/format.js"),
    dataKeys = require("../core/data/keys.js"),
    dataLoad = require("../core/data/load.js"),
    fetchData = require("../core/fetch/data.js"),
    ie = require("../client/ie.js"),
    methodReset = require("../core/methods/reset.js"),
    print = require("../core/console/print.js");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Form Element shell
//------------------------------------------------------------------------------
module.exports = function() {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Initialize the global variable object.
    //----------------------------------------------------------------------------
    var vars = {
        "types": {
            "auto": require("./types/auto.js"),
            "button": require("./types/button/button.js"),
            "drop": require("./types/drop/drop.js"),
            "toggle": require("./types/toggle.js")
        }
    };

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create the main drawing function.
    //----------------------------------------------------------------------------
    vars.self = function(selection) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Set timing to 0 if it's the first time running this function or if the
        // data length is longer than the "large" limit
        //--------------------------------------------------------------------------
        var large = vars.data.value instanceof Array && vars.data.value.length > vars.data.large;

        vars.draw.timing = vars.draw.first || large || ie ? 0 : vars.timing.ui;

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Create/update the UI element
        //--------------------------------------------------------------------------
        if (vars.data.value instanceof Array) {

            if (vars.dev.value) print.group("drawing \"" + vars.type.value + "\"");

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Analyze new data, if changed.
            //------------------------------------------------------------------------
            if (vars.data.changed) {
                vars.data.cache = {};
                dataKeys(vars, "data");
                dataFormat(vars);
            }

            vars.data.viz = fetchData(vars);

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Sort the data, if needed.
            //------------------------------------------------------------------------
            if (vars.data.sort.value && (vars.data.changed || vars.order.changed || vars.order.sort.changed)) {
                arraySort(vars.data.viz, vars.order.value || vars.text.value,
                    vars.order.sort.value, vars.color.value, vars);
            }

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Set first element in data as focus if there is no focus set.
            //------------------------------------------------------------------------
            if (vars.focus.value === false && ["auto", "button"].indexOf(vars.type.value) < 0) {

                var element = vars.data.element.value;

                if (element && element.node().tagName.toLowerCase() === "select") {
                    var i = element.property("selectedIndex");
                    i = i < 0 ? 0 : i;
                    var option = element.selectAll("option")[0][i],
                        val = option.getAttribute("data-" + vars.id.value) || option.getAttribute(vars.id.value);
                    if (val) vars.focus.value = val;
                }

                if (vars.focus.value === false && vars.data.viz.length) {
                    vars.focus.value = vars.data.viz[0][vars.id.value];
                }

                if (vars.dev.value && vars.focus.value !== false) print.log("\"value\" set to \"" + vars.focus.value + "\"");

            }

            var getLevel = function(d, depth) {

                depth = typeof depth !== "number" ? vars.id.nesting.length === 1 ? 0 : vars.id.nesting.length - 1 : depth;
                var level = vars.id.nesting[depth];

                if (depth > 0 && (!(level in d) || d[level] instanceof Array)) {
                    return getLevel(d, depth - 1);
                } else {
                    return level;
                }

            };

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Run these things if the data has changed.
            //------------------------------------------------------------------------
            if (vars.data.changed) {

                //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // Determine if search box is needed.
                //----------------------------------------------------------------------
                if (vars.search.value === "auto") {

                    if (vars.data.viz.length > 10) {
                        vars.search.enabled = true;
                        if (vars.dev.value) print.log("Search enabled.");
                    } else {
                        vars.search.enabled = false;
                        if (vars.dev.value) print.log("Search disabled.");
                    }

                } else {

                    vars.search.enabled = vars.search.value;

                }

                //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // Update OPTION elements with the new data.
                //----------------------------------------------------------------------
                var elementTag = vars.data.element.value ? vars.data.element.value.node().tagName.toLowerCase() : "";
                if (vars.data.element.value && elementTag === "select") {

                    var optionData = [];
                    for (var level in vars.data.nested.all) {
                        optionData = optionData.concat(vars.data.nested.all[level]);
                    }

                    options = vars.data.element.value.selectAll("option")
                        .data(optionData, function(d) {
                            var level = d ? getLevel(d) : false;
                            return d && level in d ? d[level] : false;
                        });

                    options.exit().remove();

                    options.enter().append("option");

                    options
                        .each(function(d) {

                            var level = getLevel(d),
                                textKey = level === vars.id.value ? vars.text.value || vars.id.value :
                                vars.text.nesting !== true && level in vars.text.nesting ? vars.text.nesting[level] : level;

                            for (var k in d) {

                                if (typeof d[k] !== "object") {

                                    if (k === textKey) {
                                        d3.select(this).html(d[k]);
                                    }

                                    if (["alt", "value"].indexOf(k) >= 0) {
                                        d3.select(this).attr(k, d[k]);
                                    } else {
                                        d3.select(this).attr("data-" + k, d[k]);
                                    }

                                }

                            }

                            if (d[level] === vars.focus.value) {
                                this.selected = true;
                            } else {
                                this.selected = false;
                            }

                        });

                }

            } else if (vars.focus.changed && vars.data.element.value) {
                var tag = vars.data.element.value.node().tagName.toLowerCase();
                if (tag === "select") {
                    vars.data.element.value.selectAll("option")
                        .each(function(d) {
                            if (d[getLevel(d)] === vars.focus.value) {
                                this.selected = true;
                            } else {
                                this.selected = false;
                            }
                        });
                } else {
                    var tag = vars.data.element.value.attr("type").toLowerCase();
                    if (tag === "radio") {
                        vars.data.element.value
                            .each(function(d) {
                                if (this.value === vars.focus.value) {
                                    this.checked = true;
                                } else {
                                    this.checked = false;
                                }
                            })
                    }
                }
            }

            if (vars.type.value !== "auto") {

                if (!vars.container.ui) {

                    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                    // Select container DIV for UI element
                    //----------------------------------------------------------------------
                    vars.container.ui = vars.container.value
                        .selectAll("div#d3po_" + vars.type.value + "_" + vars.container.id)
                        .data(["container"]);

                    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                    // Create container DIV for UI element
                    //----------------------------------------------------------------------
                    var before = vars.data.element.value ? vars.data.element.value[0][0] : null;

                    if (before) {

                        if (before.id) {
                            before = "#" + before.id;
                        } else {

                            var id = before.getAttribute(vars.id.value) ? vars.id.value : "data-" + vars.id.value;

                            if (before.getAttribute(id)) {
                                before = "[" + id + "=" + before.getAttribute(id) + "]";
                            } else {
                                before = null;
                            }

                        }

                    }

                    vars.container.ui.enter()
                        .insert("div", before)
                        .attr("id", "d3po_" + vars.type.value + "_" + vars.container.id)
                        .style("position", "relative")
                        .style("overflow", "visible")
                        .style("vertical-align", "top");

                }

                //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // Update Container
                //------------------------------------------------------------------------
                vars.container.ui
                    .style("display", vars.ui.display.value);

                vars.container.ui.transition().duration(vars.draw.timing)
                    .style("margin", vars.ui.margin.css);

                //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // Create title, if available.
                //------------------------------------------------------------------------
                var title = vars.container.ui.selectAll("div.d3po_title")
                    .data(vars.title.value ? [vars.title.value] : []);

                title.enter().insert("div", "#d3po_" + vars.type.value + "_" + vars.container.id)
                    .attr("class", "d3po_title")
                    .style("display", "inline-block");

                title
                    .style("color", vars.font.color)
                    .style("font-family", vars.font.family.value)
                    .style("font-size", vars.font.size + "px")
                    .style("font-weight", vars.font.weight)
                    .style("padding", vars.ui.padding.css)
                    .style("border-color", "transparent")
                    .style("border-style", "solid")
                    .style("border-width", vars.ui.border + "px")
                    .text(String)
                    .each(function(d) {
                        vars.margin.left = this.offsetWidth;
                    });

            }

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Call specific UI element type, if there is data.
            //------------------------------------------------------------------------
            if (vars.data.value.length) {

                var app = vars.format.locale.value.visualization[vars.type.value];
                if (vars.dev.value) print.time("drawing " + app);
                vars.types[vars.type.value](vars);
                if (vars.dev.value) print.timeEnd("drawing " + app);

            } else if (vars.data.url && (!vars.data.loaded || vars.data.stream)) {

                dataLoad(vars, "data", vars.self.draw);

            }

            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // Initialization complete
            //------------------------------------------------------------------------
            if (vars.dev.value) print.timeEnd("total draw time");
            methodReset(vars);

        }

    };

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Define methods and expose public variables.
    //----------------------------------------------------------------------------
    attach(vars, {
        "active": require("./methods/active.js"),
        "alt": require("./methods/alt.js"),
        "color": require("./methods/color.js"),
        "config": require("./methods/config.js"),
        "container": require("./methods/container.js"),
        "data": require("./methods/data.js"),
        "depth": require("./methods/depth.js"),
        "dev": require("./methods/dev.js"),
        "draw": require("./methods/draw.js"),
        "focus": require("./methods/focus.js"),
        "font": require("./methods/font.js"),
        "format": require("./methods/format.js"),
        "height": require("./methods/height.js"),
        "history": require("./methods/history.js"),
        "hover": require("./methods/hover.js"),
        "icon": require("./methods/icon.js"),
        "id": require("./methods/id.js"),
        "keywords": require("./methods/keywords.js"),
        "margin": require("./methods/margin.js"),
        "open": require("./methods/open.js"),
        "order": require("./methods/order.js"),
        "remove": require("./methods/remove.js"),
        "search": require("./methods/search.js"),
        "select": require("./methods/select.js"),
        "selectAll": require("./methods/selectall.js"),
        "text": require("./methods/text.js"),
        "timing": require("./methods/timing.js"),
        "title": require("./methods/title.js"),
        "type": require("./methods/type.js"),
        "ui": require("./methods/ui.js"),
        "width": require("./methods/width.js")
    });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Finally, return the main UI function to the user
    //----------------------------------------------------------------------------
    return vars.self;

};