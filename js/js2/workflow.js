

function init(){
    var dragged = null;

var _this=this;
this.myDiagram=null;
    document.addEventListener("dragstart", function(event) {
        if (event.target.className !== "menu-con") return;
        // Some data must be set to allow drag
        // event.dataTransfer.setData("text", event.target.textContent);
        event.dataTransfer.setData("text", event.target.id);

        // store a reference to the dragged element and the offset of the mouse from the center of the element
        dragged = event.target;
        dragged.offsetX = event.offsetX - dragged.clientWidth / 2;
        dragged.offsetY = event.offsetY - dragged.clientHeight / 2;
        // Objects during drag will have a red border
        event.target.style.border = "2px solid red";
    }, false);
    document.addEventListener("dragend", function(event) {
        if (event.target.className !== "menu-con") return;
        event.target.style.border = "";
    }, false);

    // This event resets styles after a drag has completed (successfully or not)
    var div = document.getElementById("myDiagramDiv");
    div.addEventListener("dragover", function(event) {
        // We call preventDefault to allow a drop
        // But on divs that already contain an element,
        // we want to disallow dropping

        if (this === myDiagram.div) {
            var can = event.target;

            // if the target is not the canvas, we may have trouble, so just quit:
            if (!(can instanceof HTMLCanvasElement)) return;
        }

        div.addEventListener("dragenter", function(event) {
            event.preventDefault();
        }, false);
        event.preventDefault();
    }, false);
    div.addEventListener("drop", function(event) {
        event.preventDefault();
        if (this === myDiagram.div) {
            var can = event.target;
            var pixelratio = window.PIXELRATIO;

            // if the target is not the canvas, we may have trouble, so just quit:
            if (!(can instanceof HTMLCanvasElement)) return;
            function getSource (data) {
              if (data==="Source") {
                  return "icons/source1.png"
              }else if (data==="Target"){
                  return "icons/target1.png"
              } else if (data==="Transformation"){
                  return "icons/transformation.png"
              }
            }
            myDiagram.startTransaction('new node');
            myDiagram.model.addNodeData({
                key:1,
                source: getSource(event.dataTransfer.getData("text")),
                leftArray: [{ "portId":"left0"}],
                rightArray: [{"portId":"left1"}],
                text: event.dataTransfer.getData("text")
            });
            myDiagram.commitTransaction('new node');
        }
    }, false);

    var $ = go.GraphObject.make;
    getDiagramTemplate();
    function mouseEnter(e, obj) {
        var shape = obj.findObject("BODY");

    };

    function mouseLeave(e, obj) {
        var shape = obj.findObject("PANEL");
        obj.background=null;

    };
    var refreshDiv = document.getElementById("refresh");
    refreshDiv.addEventListener('click', function (event) {
        var jsonVal=myDiagram.model.toJson();
        myDiagram.layout=$(go.TreeLayout,
            { comparer: go.LayoutVertex.smartComparer });
        myDiagram.model = go.Model.fromJson(jsonVal);

    });
    function getDiagramTemplate() {
        myDiagram =
            $(go.Diagram, "myDiagramDiv",
                { "undoManager.isEnabled": true,
                    initialAutoScale: go.Diagram.UniformToFill,
                    // layout: $(go.TreeLayout,
                    //     { comparer: go.LayoutVertex.smartComparer }),
                    nodeSelectionAdornmentTemplate:
                        $(go.Adornment, "Auto",
                            { layerName: "Grid" },  // the predefined layer that is behind everything else
                            // $(go.Shape, "Circle", { fill: "#fff1dc", stroke: null }),
                            $(go.Placeholder)
                        ),
                    linkSelectionAdornmentTemplate:
                        $(go.Adornment, "Link",
                            $(go.Shape,
                                { isPanelMain: true, fill: null, stroke: "#ff9308", strokeWidth: 2 })
                        ),});
        var portSize = new go.Size(8, 8);

        myDiagram.nodeTemplate =
            $(go.Node, "Table",
                {
                    locationObjectName: "BODY",
                    locationSpot: go.Spot.Center,
                    selectionObjectName: "BODY",
                    selectionAdorned: false,
                    shadowOffset: new go.Point(0, 0),
                    shadowBlur: 15,
                    shadowColor: "blue",
                    // toolTip:
                    mouseEnter: mouseEnter,
                    mouseLeave: mouseLeave,
                    click: function(e, node) {
                        // highlight all Links and Nodes coming out of a given Node
                        var diagram = node.diagram;
                        diagram.startTransaction("highlight");
                        // remove any previous highlighting
                        diagram.clearHighlighteds();
                        // for each Link coming out of the Node, set Link.isHighlighted
                        node.findLinksOutOf().each(function(l) { l.isHighlighted = true; });
                        // for each Node destination for the Node, set Node.isHighlighted
                        node.findNodesOutOf().each(function(n) { n.isHighlighted = true; });
                        diagram.commitTransaction("highlight");
                    },
                }, new go.Binding("isShadowed", "isSelected").ofObject(),
                // the body
                $("TreeExpanderButton",
                    {row: 0, column: 1, alignment: go.Spot.TopRight,visible: true}),
                $(go.Panel, "Auto",
                    {
                        row: 1, column: 1, name: "PIC",
                        stretch: go.GraphObject.Fill,
                        background: null,

                    },new go.Binding("background", "isHighlighted", function(h) { return h ? "#ffbe04" : null; })
                        .ofObject(),
                    $(go.Shape, "RoundedRectangle", { stroke:"#1712FF",strokeWidth:4,fill:null ,width: 100, height: 100,margin: 2}
                    ),
                    $(go.Panel,"Vertical",
                        $(go.Picture, {width: 50, height: 50
                        },new go.Binding("source","source")),
                        $(go.Shape, "MinusLine", { stroke:"#1712FF",strokeWidth:4,width: NaN, height: 4, margin: 5, fill: null }),
                        $(go.TextBlock,new go.Binding("text","text"))
                    )
                ),  // end Auto Panel body

                $(go.Panel, "Vertical",
                    new go.Binding("itemArray", "leftArray"),
                    {
                        row: 1, column: 0,
                        itemTemplate:
                            $(go.Panel,
                                {
                                    _side: "left",  // internal property to make it easier to tell which side it's on
                                    fromSpot: go.Spot.Left, toSpot: go.Spot.Left,
                                    fromLinkable: true, toLinkable: true, cursor: "pointer"
                                },
                                new go.Binding("portId", "portId"),
                                $(go.Shape, "TriangleRight",
                                    {
                                        stroke: "#1712FF", strokeWidth: 2,
                                        desiredSize: portSize,
                                        margin: new go.Margin(2, 0),
                                        fill:null
                                    })
                            )  // end itemTemplate
                    }
                ),  // end Vertical Panel
                $(go.Panel, "Vertical",
                    new go.Binding("itemArray", "rightArray"),
                    {
                        row: 1, column: 2,
                        itemTemplate:
                            $(go.Panel,
                                {
                                    _side: "right",
                                    fromSpot: go.Spot.Right, toSpot: go.Spot.Right,
                                    fromLinkable: true, toLinkable: true, cursor: "pointer"
                                },
                                new go.Binding("portId", "portId"),
                                $(go.Shape, "TriangleRight",
                                    {
                                        stroke: "#1712FF", strokeWidth: 2,
                                        desiredSize: portSize,
                                        margin: new go.Margin(2, 0),
                                        fill:null
                                    })
                            ) , // end itemTemplate

                    }
                )

            );  // end Node
        myDiagram.linkTemplate =
            $(go.Link,
                { routing: go.Link.AvoidsNodes,
                    curve: go.Link.JumpOver,
                    corner: 3,
                    relinkableFrom: true, relinkableTo: true,
                    selectionAdorned: false, // Links are not adorned when selected so that their color remains visible.
                    shadowOffset: new go.Point(0, 0), shadowBlur: 5, shadowColor: "blue"},                 // with rounded corners
                $(go.Shape,
                    // the Shape.stroke color depends on whether Link.isHighlighted is true
                    new go.Binding("stroke", "isHighlighted", function(h) { return h ? "red" : "black"; })
                        .ofObject(),
                    // the Shape.strokeWidth depends on whether Link.isHighlighted is true
                    new go.Binding("strokeWidth", "isHighlighted", function(h) { return 2; })
                        .ofObject())
            );
        this.myDiagram.click = function(e) {
            e.diagram.commit(function(d) { d.clearHighlighteds(); }, "no highlighteds");
        };
        this.myDiagram.model=go.Model.fromJson({ "class": "go.GraphLinksModel",
            "copiesArrays": true,
            "copiesArrayObjects": true,
            "linkFromPortIdProperty": "fromPort",
            "linkToPortIdProperty": "toPort",
            "nodeDataArray": [
            ],
            "linkDataArray": [

            ]});
    }
}



