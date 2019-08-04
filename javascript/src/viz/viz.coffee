attach      = require "../core/methods/attach.js"
axis        = require "./methods/helpers/axis.coffee"
flash       = require "./helpers/ui/message.js"
getSteps    = require "./helpers/drawSteps.js"
print       = require "../core/console/print.js"
container   = require "./helpers/container.js"
validObject = require "../object/validate.js"

module.exports = ->

  vars =
    g: {apps: {}}
    types:
      area:     require "./types/area.coffee"
      bar:      require "./types/bar.coffee"
      bubbles:  require "./types/bubbles.coffee"
      box:      require "./types/box.coffee"
      donut:    require "./types/donut.coffee"
      geomap:  require "./types/geomap.coffee"
      halfdonut:    require "./types/halfdonut.coffee"
      line:     require "./types/line.coffee"
      network:  require "./types/network.js"
      paths:    require "./types/paths.coffee"
      pie:      require "./types/pie.coffee"
      radar:    require "./types/radar.coffee"
      rings:    require "./types/rings.js"
      sankey:   require "./types/sankey.coffee"
      scatter:  require "./types/scatter.coffee"
      stacked:  require "./types/area.coffee"
      table:    require "./types/table.js"
      treemap: require "./types/treemap.coffee"

  # Main drawing function
  vars.self = (selection) ->

    selection.each ->

      vars.draw.frozen    = true
      vars.error.internal = null
      vars.draw.timing    = vars.timing.transitions unless "timing" of vars.draw
      vars.draw.timing    = 0 if vars.error.value

      # Analyze Container
      container vars

      # Determine if in "small" mode
      small_width     = vars.width.value <= vars.width.small
      small_height    = vars.height.value <= vars.height.small
      vars.small      = small_width or small_height
      vars.width.viz  = vars.width.value
      vars.height.viz = vars.height.value
      lastMessage     = false

      nextStep = ->
        if steps.length
          runStep()
        else
          if vars.dev.value
            print.groupEnd()
            print.timeEnd "total draw time"
            print.log "\n"
        return

      runFunction = (step, name) ->

        name = name or "function"
        if step[name] instanceof Array
          step[name].forEach (f) ->
            f vars, nextStep
            return
        else step[name] vars, nextStep if typeof step[name] is "function"
        nextStep() unless step.wait
        return

      runStep = ->

        step = steps.shift()
        same = vars.g.message and lastMessage is step.message
        run  = if "check" of step then step.check else true
        run  = run(vars) if typeof run is "function"

        if run
          if not same
            if vars.dev.value
              print.groupEnd() if lastMessage isnt false
              print.group step.message
            if typeof vars.messages.value is "string"
              lastMessage = vars.messages.value
              message     = vars.messages.value
            else
              lastMessage = step.message
              message     = vars.format.value(step.message)
            if vars.draw.update
              flash vars, message
              if vars.error.value
                runFunction step
              else
                setTimeout (->
                  runFunction step
                ), 10
            else
              runFunction step
          else
            runFunction step
        else
          if "otherwise" of step
            if vars.error.value
              runFunction step, "otherwise"
            else
              setTimeout (->
                runFunction step, "otherwise"
              ), 10
          else
            nextStep()
        return

      vars.messages.style.backup = if vars.group and vars.group.attr("opacity") is "1" then "small" else "large"

      steps = getSteps vars

      runStep()

      return

    vars.self


  # Define methods and expose public methods.
  attach vars,
    active:     require "./methods/active.js"
    aggs:       require "./methods/aggs.coffee"
    attrs:      require "./methods/attrs.coffee"
    axes:       require "./methods/axes.coffee"
    background: require "./methods/background.coffee"
    class:      require "./methods/class.coffee"
    color:      require "./methods/color.js"
    cols:       require "./methods/cols.js"
    config:     require "./methods/config.js"
    container:  require "./methods/container.js"
    coords:     require "./methods/coords.coffee"
    csv:        require "./methods/csv.coffee"
    data:       require "./methods/data.js"
    depth:      require "./methods/depth.js"
    descs:      require "./methods/descs.coffee"
    dev:        require "./methods/dev.js"
    draw:       require "./methods/draw.js"
    edges:      require "./methods/edges.js"
    error:      require "./methods/error.coffee"
    focus:      require "./methods/focus.js"
    font:       require "./methods/font.js"
    footer:     require "./methods/footer.coffee"
    format:     require "./methods/format.js"
    height:     require "./methods/height.js"
    history:    require "./methods/history.js"
    icon:       require "./methods/icon.js"
    id:         require "./methods/id.js"
    labels:     require "./methods/labels.coffee"
    legend:     require "./methods/legend.coffee"
    links:      require "./methods/links.coffee"
    margin:     require "./methods/margin.js"
    messages:   require "./methods/messages.coffee"
    mouse:      require "./methods/mouse.coffee"
    nodes:      require "./methods/nodes.coffee"
    order:      require "./methods/order.js"
    resize:     require "./methods/resize.coffee"
    shape:      require "./methods/shape.coffee"
    size:       require "./methods/size.coffee"
    style:      require "./methods/style.coffee"
    temp:       require "./methods/temp.coffee"
    text:       require "./methods/text.js"
    time:       require "./methods/time.js"
    timeline:   require "./methods/timeline.coffee"
    timing:     require "./methods/timing.js"
    title:      require "./methods/title.js"
    tooltip:    require "./methods/tooltip.coffee"
    total:      require "./methods/total.coffee"
    type:       require "./methods/type.js"
    ui:         require "./methods/ui.js"
    width:      require "./methods/width.js"
    x:          axis "x"
    x2:         axis "x2"
    y:          axis "y"
    y2:         axis "y2"
    zoom:       require "./methods/zoom.js"

  vars.self
