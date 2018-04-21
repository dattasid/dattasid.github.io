/*!
Copyright (C) 2010-2013 Raymond Hill: https://github.com/gorhill/Javascript-Voronoi
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
*/
/*
Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
Contributor (conversion to typescript): Sid Datta (https://github.com/dattasid)
File: rhill-voronoi-core.js
Version: 0.98
Date: January 21, 2013
Description: This is my personal Javascript implementation of
Steven Fortune's algorithm to compute Voronoi diagrams.

License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md

## Usage:

  var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
  // xl, xr means x left, x right
  // yt, yb means y top, y bottom
  var bbox = {xl:0, xr:800, yt:0, yb:600};
  var voronoi = new Voronoi();
  // pass an object which exhibits xl, xr, yt, yb properties. The bounding
  // box will be used to connect unbound edges, and to close open cells
  result = voronoi.compute(sites, bbox);
  // render, further analyze, etc.

Return value:
  An object with the following properties:

  result.vertices = an array of unordered, unique Voronoi.Vertex objects making
    up the Voronoi diagram.
  result.edges = an array of unordered, unique Voronoi.Edge objects making up
    the Voronoi diagram.
  result.cells = an array of Voronoi.Cell object making up the Voronoi diagram.
    A Cell object might have an empty array of halfedges, meaning no Voronoi
    cell could be computed for a particular cell.
  result.execTime = the time it took to compute the Voronoi diagram, in
    milliseconds.

Voronoi.Vertex object:
  x: The x position of the vertex.
  y: The y position of the vertex.

Voronoi.Edge object:
  lSite: the Voronoi site object at the left of this Voronoi.Edge object.
  rSite: the Voronoi site object at the right of this Voronoi.Edge object (can
    be null).
  va: an object with an 'x' and a 'y' property defining the start point
    (relative to the Voronoi site on the left) of this Voronoi.Edge object.
  vb: an object with an 'x' and a 'y' property defining the end point
    (relative to Voronoi site on the left) of this Voronoi.Edge object.

  For edges which are used to close open cells (using the supplied bounding
  box), the rSite property will be null.

Voronoi.Cell object:
  site: the Voronoi site object associated with the Voronoi cell.
  halfedges: an array of Voronoi.Halfedge objects, ordered counterclockwise,
    defining the polygon for this Voronoi cell.

Voronoi.Halfedge object:
  site: the Voronoi site object owning this Voronoi.Halfedge object.
  edge: a reference to the unique Voronoi.Edge object underlying this
    Voronoi.Halfedge object.
  getStartpoint(): a method returning an object with an 'x' and a 'y' property
    for the start point of this halfedge. Keep in mind halfedges are always
    countercockwise.
  getEndpoint(): a method returning an object with an 'x' and a 'y' property
    for the end point of this halfedge. Keep in mind halfedges are always
    countercockwise.

TODO: Identify opportunities for performance improvement.

TODO: Let the user close the Voronoi cells, do not do it automatically. Not only let
      him close the cells, but also allow him to close more than once using a different
      bounding box for the same Voronoi diagram.
*/
define("rhill-voronoi-core", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*global Math */
    // ---------------------------------------------------------------------------
    class RBNode {
        constructor() {
            this.rbPrevious = null;
            this.rbNext = null;
            this.rbLeft = null;
            this.rbRight = null;
            this.rbParent = null;
            this.rbRed = false;
        }
    }
    class RBTree {
        constructor() {
            this.root = null;
            this.rbRotateRight = function (node) {
                var p = node, q = node.rbLeft, // can't be null
                parent = p.rbParent;
                if (parent) {
                    if (parent.rbLeft === p) {
                        parent.rbLeft = q;
                    }
                    else {
                        parent.rbRight = q;
                    }
                }
                else {
                    this.root = q;
                }
                q.rbParent = parent;
                p.rbParent = q;
                p.rbLeft = q.rbRight;
                if (p.rbLeft) {
                    p.rbLeft.rbParent = p;
                }
                q.rbRight = p;
            };
        }
        rbInsertSuccessor(node, successor) {
            var parent;
            if (node) {
                // >>> rhill 2011-05-27: Performance: cache previous/next nodes
                successor.rbPrevious = node;
                successor.rbNext = node.rbNext;
                if (node.rbNext) {
                    node.rbNext.rbPrevious = successor;
                }
                node.rbNext = successor;
                // <<<
                if (node.rbRight) {
                    // in-place expansion of node.rbRight.getFirst();
                    node = node.rbRight;
                    while (node.rbLeft) {
                        node = node.rbLeft;
                    }
                    node.rbLeft = successor;
                }
                else {
                    node.rbRight = successor;
                }
                parent = node;
            }
            else if (this.root) {
                node = this.getFirst(this.root);
                // >>> Performance: cache previous/next nodes
                successor.rbPrevious = null;
                successor.rbNext = node;
                node.rbPrevious = successor;
                // <<<
                node.rbLeft = successor;
                parent = node;
            }
            else {
                // >>> Performance: cache previous/next nodes
                successor.rbPrevious = successor.rbNext = null;
                // <<<
                this.root = successor;
                parent = null;
            }
            successor.rbLeft = successor.rbRight = null;
            successor.rbParent = parent;
            successor.rbRed = true;
            // Fixup the modified tree by recoloring nodes and performing
            // rotations (2 at most) hence the red-black tree properties are
            // preserved.
            var grandpa, uncle;
            node = successor;
            while (parent && parent.rbRed) {
                grandpa = parent.rbParent;
                if (parent === grandpa.rbLeft) {
                    uncle = grandpa.rbRight;
                    if (uncle && uncle.rbRed) {
                        parent.rbRed = uncle.rbRed = false;
                        grandpa.rbRed = true;
                        node = grandpa;
                    }
                    else {
                        if (node === parent.rbRight) {
                            this.rbRotateLeft(parent);
                            node = parent;
                            parent = node.rbParent;
                        }
                        parent.rbRed = false;
                        grandpa.rbRed = true;
                        this.rbRotateRight(grandpa);
                    }
                }
                else {
                    uncle = grandpa.rbLeft;
                    if (uncle && uncle.rbRed) {
                        parent.rbRed = uncle.rbRed = false;
                        grandpa.rbRed = true;
                        node = grandpa;
                    }
                    else {
                        if (node === parent.rbLeft) {
                            this.rbRotateRight(parent);
                            node = parent;
                            parent = node.rbParent;
                        }
                        parent.rbRed = false;
                        grandpa.rbRed = true;
                        this.rbRotateLeft(grandpa);
                    }
                }
                parent = node.rbParent;
            }
            this.root.rbRed = false;
        }
        rbRemoveNode(node) {
            // >>> rhill 2011-05-27: Performance: cache previous/next nodes
            if (node.rbNext) {
                node.rbNext.rbPrevious = node.rbPrevious;
            }
            if (node.rbPrevious) {
                node.rbPrevious.rbNext = node.rbNext;
            }
            node.rbNext = node.rbPrevious = null;
            // <<<
            var parent = node.rbParent, left = node.rbLeft, right = node.rbRight, next;
            if (!left) {
                next = right;
            }
            else if (!right) {
                next = left;
            }
            else {
                next = this.getFirst(right);
            }
            if (parent) {
                if (parent.rbLeft === node) {
                    parent.rbLeft = next;
                }
                else {
                    parent.rbRight = next;
                }
            }
            else {
                this.root = next;
            }
            // enforce red-black rules
            var isRed;
            if (left && right) {
                isRed = next.rbRed;
                next.rbRed = node.rbRed;
                next.rbLeft = left;
                left.rbParent = next;
                if (next !== right) {
                    parent = next.rbParent;
                    next.rbParent = node.rbParent;
                    node = next.rbRight;
                    parent.rbLeft = node;
                    next.rbRight = right;
                    right.rbParent = next;
                }
                else {
                    next.rbParent = parent;
                    parent = next;
                    node = next.rbRight;
                }
            }
            else {
                isRed = node.rbRed;
                node = next;
            }
            // 'node' is now the sole successor's child and 'parent' its
            // new parent (since the successor can have been moved)
            if (node) {
                node.rbParent = parent;
            }
            // the 'easy' cases
            if (isRed) {
                return;
            }
            if (node && node.rbRed) {
                node.rbRed = false;
                return;
            }
            // the other cases
            var sibling;
            do {
                if (node === this.root) {
                    break;
                }
                if (node === parent.rbLeft) {
                    sibling = parent.rbRight;
                    if (sibling.rbRed) {
                        sibling.rbRed = false;
                        parent.rbRed = true;
                        this.rbRotateLeft(parent);
                        sibling = parent.rbRight;
                    }
                    if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                        if (!sibling.rbRight || !sibling.rbRight.rbRed) {
                            sibling.rbLeft.rbRed = false;
                            sibling.rbRed = true;
                            this.rbRotateRight(sibling);
                            sibling = parent.rbRight;
                        }
                        sibling.rbRed = parent.rbRed;
                        parent.rbRed = sibling.rbRight.rbRed = false;
                        this.rbRotateLeft(parent);
                        node = this.root;
                        break;
                    }
                }
                else {
                    sibling = parent.rbLeft;
                    if (sibling.rbRed) {
                        sibling.rbRed = false;
                        parent.rbRed = true;
                        this.rbRotateRight(parent);
                        sibling = parent.rbLeft;
                    }
                    if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                        if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
                            sibling.rbRight.rbRed = false;
                            sibling.rbRed = true;
                            this.rbRotateLeft(sibling);
                            sibling = parent.rbLeft;
                        }
                        sibling.rbRed = parent.rbRed;
                        parent.rbRed = sibling.rbLeft.rbRed = false;
                        this.rbRotateRight(parent);
                        node = this.root;
                        break;
                    }
                }
                sibling.rbRed = true;
                node = parent;
                parent = parent.rbParent;
            } while (!node.rbRed);
            if (node) {
                node.rbRed = false;
            }
        }
        rbRotateLeft(node) {
            var p = node, q = node.rbRight, // can't be null
            parent = p.rbParent;
            if (parent) {
                if (parent.rbLeft === p) {
                    parent.rbLeft = q;
                }
                else {
                    parent.rbRight = q;
                }
            }
            else {
                this.root = q;
            }
            q.rbParent = parent;
            p.rbParent = q;
            p.rbRight = q.rbLeft;
            if (p.rbRight) {
                p.rbRight.rbParent = p;
            }
            q.rbLeft = p;
        }
        getFirst(node) {
            while (node.rbLeft) {
                node = node.rbLeft;
            }
            return node;
        }
        getLast(node) {
            while (node.rbRight) {
                node = node.rbRight;
            }
            return node;
        }
    }
    class BBox {
    }
    exports.BBox = BBox;
    class Cell {
        constructor(site) {
            this.site = site;
            this.halfedges = [];
            this.closeMe = false;
        }
        init(site) {
            this.site = site;
            this.halfedges = [];
            this.closeMe = false;
            return this;
        }
        prepareHalfedges() {
            var halfedges = this.halfedges, iHalfedge = halfedges.length, edge;
            // get rid of unused halfedges
            // rhill 2011-05-27: Keep it simple, no point here in trying
            // to be fancy: dangling edges are a typically a minority.
            while (iHalfedge--) {
                edge = halfedges[iHalfedge].edge;
                if (!edge.vb || !edge.va) {
                    halfedges.splice(iHalfedge, 1);
                }
            }
            // rhill 2011-05-26: I tried to use a binary search at insertion
            // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
            // There was no real benefits in doing so, performance on
            // Firefox 3.6 was improved marginally, while performance on
            // Opera 11 was penalized marginally.
            halfedges.sort(function (a, b) { return b.angle - a.angle; });
            return halfedges.length;
        }
        // Return a list of the neighbor Ids
        getNeighborIds() {
            var neighbors = [], iHalfedge = this.halfedges.length, edge;
            while (iHalfedge--) {
                edge = this.halfedges[iHalfedge].edge;
                if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
                    neighbors.push(edge.lSite.voronoiId);
                }
                else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId) {
                    neighbors.push(edge.rSite.voronoiId);
                }
            }
            return neighbors;
        }
        // Compute bounding box
        //
        getBbox() {
            let halfedges = this.halfedges, iHalfedge = halfedges.length, xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, v, vx, vy;
            while (iHalfedge--) {
                v = halfedges[iHalfedge].getStartpoint();
                vx = v.x;
                vy = v.y;
                if (vx < xmin) {
                    xmin = vx;
                }
                if (vy < ymin) {
                    ymin = vy;
                }
                if (vx > xmax) {
                    xmax = vx;
                }
                if (vy > ymax) {
                    ymax = vy;
                }
                // we dont need to take into account end point,
                // since each end point matches a start point
            }
            return {
                xl: xmin,
                yt: ymin,
                xr: xmax,
                yb: ymax
                // width: xmax-xmin,
                // height: ymax-ymin
            };
        }
        // Return whether a point is inside, on, or outside the cell:
        //   -1: point is outside the perimeter of the cell
        //    0: point is on the perimeter of the cell
        //    1: point is inside the perimeter of the cell
        //
        pointIntersection(x, y) {
            // Check if point in polygon. Since all polygons of a Voronoi
            // diagram are convex, then:
            // http://paulbourke.net/geometry/polygonmesh/
            // Solution 3 (2D):
            //   "If the polygon is convex then one can consider the polygon
            //   "as a 'path' from the first vertex. A point is on the interior
            //   "of this polygons if it is always on the same side of all the
            //   "line segments making up the path. ...
            //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
            //   "if it is less than 0 then P is to the right of the line segment,
            //   "if greater than 0 it is to the left, if equal to 0 then it lies
            //   "on the line segment"
            let halfedges = this.halfedges, iHalfedge = halfedges.length, halfedge, p0, p1, r;
            while (iHalfedge--) {
                halfedge = halfedges[iHalfedge];
                p0 = halfedge.getStartpoint();
                p1 = halfedge.getEndpoint();
                r = (y - p0.y) * (p1.x - p0.x) - (x - p0.x) * (p1.y - p0.y);
                if (!r) {
                    return 0;
                }
                if (r > 0) {
                    return -1;
                }
            }
            return 1;
        }
    }
    class Vertex {
        // readonly id = Vertex._id++
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    exports.Vertex = Vertex;
    class Site {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.voronoiId = 0;
        }
    }
    exports.Site = Site;
    class Edge {
        constructor(lSite, rSite) {
            this.lSite = lSite;
            this.rSite = rSite;
            this.va = this.vb = null;
        }
    }
    exports.Edge = Edge;
    class Halfedge {
        constructor(edge, lSite, rSite) {
            this.site = null;
            this.edge = null;
            this.site = lSite;
            this.edge = edge;
            // 'angle' is a value to be used for properly sorting the
            // halfsegments counterclockwise. By convention, we will
            // use the angle of the line defined by the 'site to the left'
            // to the 'site to the right'.
            // However, border edges have no 'site to the right': thus we
            // use the angle of line perpendicular to the halfsegment (the
            // edge should have both end points defined in such case.)
            if (rSite) {
                this.angle = Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x);
            }
            else {
                var va = edge.va, vb = edge.vb;
                // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
                // but for performance purpose, these are expanded in place here.
                this.angle = edge.lSite === lSite ?
                    Math.atan2(vb.x - va.x, va.y - vb.y) :
                    Math.atan2(va.x - vb.x, vb.y - va.y);
            }
        }
        getStartpoint() {
            return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
        }
        getEndpoint() {
            return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
        }
    }
    // ---------------------------------------------------------------------------
    // Beachline methods
    // rhill 2011-06-07: For some reasons, performance suffers significantly
    // when instanciating a literal object instead of an empty ctor
    class Beachsection extends RBNode {
        constructor() {
            super();
            this.site = null;
            this.circleEvent = null;
            this.edge = null;
        }
    }
    ;
    // rhill 2011-06-07: For some reasons, performance suffers significantly
    // when instanciating a literal object instead of an empty ctor
    class CircleEvent extends RBNode {
        constructor() {
            super();
            this.site = null;
            // rhill 2013-10-12: it helps to state exactly what we are at ctor time.
            this.arc = null;
            this.rbLeft = null;
            this.rbNext = null;
            this.rbParent = null;
            this.rbPrevious = null;
            this.rbRed = false;
            this.rbRight = null;
            this.site = null;
            this.x = this.y = this.ycenter = 0;
        }
    }
    // ---------------------------------------------------------------------------
    // Diagram methods
    class Diagram {
        constructor() {
        }
    }
    exports.Diagram = Diagram;
    class Voronoi {
        constructor() {
            this.vertices = null;
            this.edges = null;
            this.cells = null;
            this.toRecycle = null;
            this.beachsectionJunkyard = [];
            this.circleEventJunkyard = [];
            this.vertexJunkyard = [];
            this.edgeJunkyard = [];
            this.cellJunkyard = [];
            this.beachline = null;
            this.circleEvents = null;
            this.firstCircleEvent = null;
            this.sqrt = Math.sqrt;
            this.abs = Math.abs;
            this.equalWithEpsilon = function (a, b) { return this.abs(a - b) < Voronoi.ε; };
            this.greaterThanWithEpsilon = function (a, b) { return a - b > Voronoi.ε; };
            this.greaterThanOrEqualWithEpsilon = function (a, b) { return b - a < Voronoi.ε; };
            this.lessThanWithEpsilon = function (a, b) { return b - a > Voronoi.ε; };
            this.lessThanOrEqualWithEpsilon = function (a, b) { return a - b < Voronoi.ε; };
            // calculate the right break point of a particular beach section,
            // given a particular directrix
            this.rightBreakPoint = function (arc, directrix) {
                var rArc = arc.rbNext;
                if (rArc) {
                    return this.leftBreakPoint(rArc, directrix);
                }
                var site = arc.site;
                return site.y === directrix ? site.x : Infinity;
            };
        }
        // ---------------------------------------------------------------------------
        reset() {
            if (!this.beachline) {
                this.beachline = new RBTree();
            }
            // Move leftover beachsections to the beachsection junkyard.
            if (this.beachline.root) {
                var beachsection = this.beachline.getFirst(this.beachline.root);
                while (beachsection) {
                    this.beachsectionJunkyard.push(beachsection); // mark for reuse
                    beachsection = beachsection.rbNext;
                }
            }
            this.beachline.root = null;
            if (!this.circleEvents) {
                this.circleEvents = new RBTree();
            }
            this.circleEvents.root = this.firstCircleEvent = null;
            this.vertices = [];
            this.edges = [];
            this.cells = [];
        }
        // ---------------------------------------------------------------------------
        // Red-Black tree code (based on C version of "rbtree" by Franck Bui-Huu
        // https://github.com/fbuihuu/libtree/blob/master/rb.c
        // ---------------------------------------------------------------------------
        // Cell methods
        createCell(site) {
            var cell = this.cellJunkyard.pop();
            if (cell) {
                return cell.init(site);
            }
            return new Cell(site);
        }
        // ---------------------------------------------------------------------------
        // Edge methods
        //
        createHalfedge(edge, lSite, rSite) {
            return new Halfedge(edge, lSite, rSite);
        }
        // this create and add a vertex to the internal collection
        createVertex(x, y) {
            var v = this.vertexJunkyard.pop();
            if (!v) {
                v = new Vertex(x, y);
            }
            else {
                v.x = x;
                v.y = y;
            }
            this.vertices.push(v);
            // TODO: Figure out why same vertex repeated multiple times
            // Note: Only Vertices on bounding box are repeated. They are
            //       created from connectEdge and closeCells.
            // Since its only vertices on BB, a) They can be resolved by comparing
            // x and y simply enough b) Voronoi edge graph should be easy enough
            // to make for most purposes.
            // console.log(v)
            // console.trace()
            return v;
        }
        // this create and add an edge to internal collection, and also create
        // two halfedges which are added to each site's counterclockwise array
        // of halfedges.
        createEdge(lSite, rSite, va, vb) {
            var edge = this.edgeJunkyard.pop();
            if (!edge) {
                edge = new Edge(lSite, rSite);
            }
            else {
                edge.lSite = lSite;
                edge.rSite = rSite;
                edge.va = edge.vb = null;
            }
            this.edges.push(edge);
            if (va) {
                this.setEdgeStartpoint(edge, lSite, rSite, va);
            }
            if (vb) {
                this.setEdgeEndpoint(edge, lSite, rSite, vb);
            }
            this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
            this.cells[rSite.voronoiId].halfedges.push(this.createHalfedge(edge, rSite, lSite));
            return edge;
        }
        createBorderEdge(lSite, va, vb) {
            var edge = this.edgeJunkyard.pop();
            if (!edge) {
                edge = new Edge(lSite, null);
            }
            else {
                edge.lSite = lSite;
                edge.rSite = null;
            }
            edge.va = va;
            edge.vb = vb;
            this.edges.push(edge);
            return edge;
        }
        setEdgeStartpoint(edge, lSite, rSite, vertex) {
            if (!edge.va && !edge.vb) {
                edge.va = vertex;
                edge.lSite = lSite;
                edge.rSite = rSite;
            }
            else if (edge.lSite === rSite) {
                edge.vb = vertex;
            }
            else {
                edge.va = vertex;
            }
        }
        setEdgeEndpoint(edge, lSite, rSite, vertex) {
            this.setEdgeStartpoint(edge, rSite, lSite, vertex);
        }
        // rhill 2011-06-02: A lot of Beachsection instanciations
        // occur during the computation of the Voronoi diagram,
        // somewhere between the number of sites and twice the
        // number of sites, while the number of Beachsections on the
        // beachline at any given time is comparatively low. For this
        // reason, we reuse already created Beachsections, in order
        // to avoid new memory allocation. This resulted in a measurable
        // performance gain.
        createBeachsection(site) {
            var beachsection = this.beachsectionJunkyard.pop();
            if (!beachsection) {
                beachsection = new Beachsection();
            }
            beachsection.site = site;
            return beachsection;
        }
        // calculate the left break point of a particular beach section,
        // given a particular sweep line
        leftBreakPoint(arc, directrix) {
            // http://en.wikipedia.org/wiki/Parabola
            // http://en.wikipedia.org/wiki/Quadratic_equation
            // h1 = x1,
            // k1 = (y1+directrix)/2,
            // h2 = x2,
            // k2 = (y2+directrix)/2,
            // p1 = k1-directrix,
            // a1 = 1/(4*p1),
            // b1 = -h1/(2*p1),
            // c1 = h1*h1/(4*p1)+k1,
            // p2 = k2-directrix,
            // a2 = 1/(4*p2),
            // b2 = -h2/(2*p2),
            // c2 = h2*h2/(4*p2)+k2,
            // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
            // When x1 become the x-origin:
            // h1 = 0,
            // k1 = (y1+directrix)/2,
            // h2 = x2-x1,
            // k2 = (y2+directrix)/2,
            // p1 = k1-directrix,
            // a1 = 1/(4*p1),
            // b1 = 0,
            // c1 = k1,
            // p2 = k2-directrix,
            // a2 = 1/(4*p2),
            // b2 = -h2/(2*p2),
            // c2 = h2*h2/(4*p2)+k2,
            // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1
            // change code below at your own risk: care has been taken to
            // reduce errors due to computers' finite arithmetic precision.
            // Maybe can still be improved, will see if any more of this
            // kind of errors pop up again.
            var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
            // parabola in degenerate case where focus is on directrix
            if (!pby2) {
                return rfocx;
            }
            var lArc = arc.rbPrevious;
            if (!lArc) {
                return -Infinity;
            }
            site = lArc.site;
            var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
            // parabola in degenerate case where focus is on directrix
            if (!plby2) {
                return lfocx;
            }
            var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
            if (aby2) {
                return (-b + this.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
            }
            // both parabolas have same distance to directrix, thus break point is midway
            return (rfocx + lfocx) / 2;
        }
        detachBeachsection(beachsection) {
            this.detachCircleEvent(beachsection); // detach potentially attached circle event
            this.beachline.rbRemoveNode(beachsection); // remove from RB-tree
            this.beachsectionJunkyard.push(beachsection); // mark for reuse
        }
        ;
        removeBeachsection(beachsection) {
            var circle = beachsection.circleEvent, x = circle.x, y = circle.ycenter, vertex = this.createVertex(x, y), previous = beachsection.rbPrevious, next = beachsection.rbNext, disappearingTransitions = [beachsection], abs_fn = Math.abs;
            // remove collapsed beachsection from beachline
            this.detachBeachsection(beachsection);
            // there could be more than one empty arc at the deletion point, this
            // happens when more than two edges are linked by the same vertex,
            // so we will collect all those edges by looking up both sides of
            // the deletion point.
            // by the way, there is *always* a predecessor/successor to any collapsed
            // beach section, it's just impossible to have a collapsing first/last
            // beach sections on the beachline, since they obviously are unconstrained
            // on their left/right side.
            // look left
            var lArc = previous;
            while (lArc.circleEvent && abs_fn(x - lArc.circleEvent.x) < 1e-9 && abs_fn(y - lArc.circleEvent.ycenter) < 1e-9) {
                previous = lArc.rbPrevious;
                disappearingTransitions.unshift(lArc);
                this.detachBeachsection(lArc); // mark for reuse
                lArc = previous;
            }
            // even though it is not disappearing, I will also add the beach section
            // immediately to the left of the left-most collapsed beach section, for
            // convenience, since we need to refer to it later as this beach section
            // is the 'left' site of an edge for which a start point is set.
            disappearingTransitions.unshift(lArc);
            this.detachCircleEvent(lArc);
            // look right
            var rArc = next;
            while (rArc.circleEvent && abs_fn(x - rArc.circleEvent.x) < 1e-9 && abs_fn(y - rArc.circleEvent.ycenter) < 1e-9) {
                next = rArc.rbNext;
                disappearingTransitions.push(rArc);
                this.detachBeachsection(rArc); // mark for reuse
                rArc = next;
            }
            // we also have to add the beach section immediately to the right of the
            // right-most collapsed beach section, since there is also a disappearing
            // transition representing an edge's start point on its left.
            disappearingTransitions.push(rArc);
            this.detachCircleEvent(rArc);
            // walk through all the disappearing transitions between beach sections and
            // set the start point of their (implied) edge.
            var nArcs = disappearingTransitions.length, iArc;
            for (iArc = 1; iArc < nArcs; iArc++) {
                rArc = disappearingTransitions[iArc];
                lArc = disappearingTransitions[iArc - 1];
                this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
            }
            // create a new edge as we have now a new transition between
            // two beach sections which were previously not adjacent.
            // since this edge appears as a new vertex is defined, the vertex
            // actually define an end point of the edge (relative to the site
            // on the left)
            lArc = disappearingTransitions[0];
            rArc = disappearingTransitions[nArcs - 1];
            rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);
            // create circle events if any for beach sections left in the beachline
            // adjacent to collapsed sections
            this.attachCircleEvent(lArc);
            this.attachCircleEvent(rArc);
        }
        addBeachsection(site) {
            var x = site.x, directrix = site.y;
            // find the left and right beach sections which will surround the newly
            // created beach section.
            // rhill 2011-06-01: This loop is one of the most often executed,
            // hence we expand in-place the comparison-against-epsilon calls.
            var lArc, rArc, dxl, dxr, node = this.beachline.root;
            while (node) {
                dxl = this.leftBreakPoint(node, directrix) - x;
                // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection
                if (dxl > 1e-9) {
                    // this case should never happen
                    // if (!node.rbLeft) {
                    //    rArc = node.rbLeft;
                    //    break;
                    //    }
                    node = node.rbLeft;
                }
                else {
                    dxr = x - this.rightBreakPoint(node, directrix);
                    // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection
                    if (dxr > 1e-9) {
                        if (!node.rbRight) {
                            lArc = node;
                            break;
                        }
                        node = node.rbRight;
                    }
                    else {
                        // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
                        if (dxl > -1e-9) {
                            lArc = node.rbPrevious;
                            rArc = node;
                        }
                        else if (dxr > -1e-9) {
                            lArc = node;
                            rArc = node.rbNext;
                        }
                        else {
                            lArc = rArc = node;
                        }
                        break;
                    }
                }
            }
            // at this point, keep in mind that lArc and/or rArc could be
            // undefined or null.
            // create a new beach section object for the site and add it to RB-tree
            var newArc = this.createBeachsection(site);
            this.beachline.rbInsertSuccessor(lArc, newArc);
            // cases:
            //
            // [null,null]
            // least likely case: new beach section is the first beach section on the
            // beachline.
            // This case means:
            //   no new transition appears
            //   no collapsing beach section
            //   new beachsection become root of the RB-tree
            if (!lArc && !rArc) {
                return;
            }
            // [lArc,rArc] where lArc == rArc
            // most likely case: new beach section split an existing beach
            // section.
            // This case means:
            //   one new transition appears
            //   the left and right beach section might be collapsing as a result
            //   two new nodes added to the RB-tree
            if (lArc === rArc) {
                // invalidate circle event of split beach section
                this.detachCircleEvent(lArc);
                // split the beach section into two separate beach sections
                rArc = this.createBeachsection(lArc.site);
                this.beachline.rbInsertSuccessor(newArc, rArc);
                // since we have a new transition between two beach sections,
                // a new edge is born
                newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);
                // check whether the left and right beach sections are collapsing
                // and if so create circle events, to be notified when the point of
                // collapse is reached.
                this.attachCircleEvent(lArc);
                this.attachCircleEvent(rArc);
                return;
            }
            // [lArc,null]
            // even less likely case: new beach section is the *last* beach section
            // on the beachline -- this can happen *only* if *all* the previous beach
            // sections currently on the beachline share the same y value as
            // the new beach section.
            // This case means:
            //   one new transition appears
            //   no collapsing beach section as a result
            //   new beach section become right-most node of the RB-tree
            if (lArc && !rArc) {
                newArc.edge = this.createEdge(lArc.site, newArc.site);
                return;
            }
            // [null,rArc]
            // impossible case: because sites are strictly processed from top to bottom,
            // and left to right, which guarantees that there will always be a beach section
            // on the left -- except of course when there are no beach section at all on
            // the beach line, which case was handled above.
            // rhill 2011-06-02: No point testing in non-debug version
            //if (!lArc && rArc) {
            //    throw "Voronoi.addBeachsection(): What is this I don't even";
            //    }
            // [lArc,rArc] where lArc != rArc
            // somewhat less likely case: new beach section falls *exactly* in between two
            // existing beach sections
            // This case means:
            //   one transition disappears
            //   two new transitions appear
            //   the left and right beach section might be collapsing as a result
            //   only one new node added to the RB-tree
            if (lArc !== rArc) {
                // invalidate circle events of left and right sites
                this.detachCircleEvent(lArc);
                this.detachCircleEvent(rArc);
                // an existing transition disappears, meaning a vertex is defined at
                // the disappearance point.
                // since the disappearance is caused by the new beachsection, the
                // vertex is at the center of the circumscribed circle of the left,
                // new and right beachsections.
                // http://mathforum.org/library/drmath/view/55002.html
                // Except that I bring the origin at A to simplify
                // calculation
                var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = this.createVertex((cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay);
                // one transition disappear
                this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);
                // two new transitions appear at the new vertex location
                newArc.edge = this.createEdge(lSite, site, undefined, vertex);
                rArc.edge = this.createEdge(site, rSite, undefined, vertex);
                // check whether the left and right beach sections are collapsing
                // and if so create circle events, to handle the point of collapse.
                this.attachCircleEvent(lArc);
                this.attachCircleEvent(rArc);
                return;
            }
        }
        // ---------------------------------------------------------------------------
        // Circle event methods
        attachCircleEvent(arc) {
            var lArc = arc.rbPrevious, rArc = arc.rbNext;
            if (!lArc || !rArc) {
                return;
            } // does that ever happen?
            var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
            // If site of left beachsection is same as site of
            // right beachsection, there can't be convergence
            if (lSite === rSite) {
                return;
            }
            // Find the circumscribed circle for the three sites associated
            // with the beachsection triplet.
            // rhill 2011-05-26: It is more efficient to calculate in-place
            // rather than getting the resulting circumscribed circle from an
            // object returned by calling Voronoi.circumcircle()
            // http://mathforum.org/library/drmath/view/55002.html
            // Except that I bring the origin at cSite to simplify calculations.
            // The bottom-most part of the circumcircle is our Fortune 'circle
            // event', and its center is a vertex potentially part of the final
            // Voronoi diagram.
            var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
            // If points l->c->r are clockwise, then center beach section does not
            // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
            // sign is reverse of the orientation, hence we reverse the test.
            // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
            // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
            // return infinites: 1e-12 seems to fix the problem.
            var d = 2 * (ax * cy - ay * cx);
            if (d >= -2e-12) {
                return;
            }
            var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, ycenter = y + by;
            // Important: ybottom should always be under or at sweep, so no need
            // to waste CPU cycles by checking
            // recycle circle event object if possible
            var circleEvent = this.circleEventJunkyard.pop();
            if (!circleEvent) {
                circleEvent = new CircleEvent();
            }
            circleEvent.arc = arc;
            circleEvent.site = cSite;
            circleEvent.x = x + bx;
            circleEvent.y = ycenter + this.sqrt(x * x + y * y); // y bottom
            circleEvent.ycenter = ycenter;
            arc.circleEvent = circleEvent;
            // find insertion point in RB-tree: circle events are ordered from
            // smallest to largest
            var predecessor = null, node = this.circleEvents.root;
            while (node) {
                if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
                    if (node.rbLeft) {
                        node = node.rbLeft;
                    }
                    else {
                        predecessor = node.rbPrevious;
                        break;
                    }
                }
                else {
                    if (node.rbRight) {
                        node = node.rbRight;
                    }
                    else {
                        predecessor = node;
                        break;
                    }
                }
            }
            this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);
            if (!predecessor) {
                this.firstCircleEvent = circleEvent;
            }
        }
        detachCircleEvent(arc) {
            var circleEvent = arc.circleEvent;
            if (circleEvent) {
                if (!circleEvent.rbPrevious) {
                    this.firstCircleEvent = circleEvent.rbNext;
                }
                this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree
                this.circleEventJunkyard.push(circleEvent);
                arc.circleEvent = null;
            }
        }
        // ---------------------------------------------------------------------------
        // Diagram completion methods
        // connect dangling edges (not if a cursory test tells us
        // it is not going to be visible.
        // return value:
        //   false: the dangling endpoint couldn't be connected
        //   true: the dangling endpoint could be connected
        connectEdge(edge, bbox) {
            // skip if end point already connected
            var vb = edge.vb;
            if (!!vb) {
                return true;
            }
            // make local copy for performance purpose
            var va = edge.va, xl = bbox.xl, xr = bbox.xr, yt = bbox.yt, yb = bbox.yb, lSite = edge.lSite, rSite = edge.rSite, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
            // if we reach here, this means cells which use this edge will need
            // to be closed, whether because the edge was removed, or because it
            // was connected to the bounding box.
            this.cells[lSite.voronoiId].closeMe = true;
            this.cells[rSite.voronoiId].closeMe = true;
            // get the line equation of the bisector if line is not vertical
            if (ry !== ly) {
                fm = (lx - rx) / (ry - ly);
                fb = fy - fm * fx;
            }
            // remember, direction of line (relative to left site):
            // upward: left.x < right.x
            // downward: left.x > right.x
            // horizontal: left.x == right.x
            // upward: left.x < right.x
            // rightward: left.y < right.y
            // leftward: left.y > right.y
            // vertical: left.y == right.y
            // depending on the direction, find the best side of the
            // bounding box to use to determine a reasonable start point
            // rhill 2013-12-02:
            // While at it, since we have the values which define the line,
            // clip the end of va if it is outside the bbox.
            // https://github.com/gorhill/Javascript-Voronoi/issues/15
            // TODO: Do all the clipping here rather than rely on Liang-Barsky
            // which does not do well sometimes due to loss of arithmetic
            // precision. The code here doesn't degrade if one of the vertex is
            // at a huge distance.
            // special case: vertical line
            if (fm === undefined) {
                // doesn't intersect with viewport
                if (fx < xl || fx >= xr) {
                    return false;
                }
                // downward
                if (lx > rx) {
                    if (!va || va.y < yt) {
                        va = this.createVertex(fx, yt);
                    }
                    else if (va.y >= yb) {
                        return false;
                    }
                    vb = this.createVertex(fx, yb);
                }
                else {
                    if (!va || va.y > yb) {
                        va = this.createVertex(fx, yb);
                    }
                    else if (va.y < yt) {
                        return false;
                    }
                    vb = this.createVertex(fx, yt);
                }
            }
            else if (fm < -1 || fm > 1) {
                // downward
                if (lx > rx) {
                    if (!va || va.y < yt) {
                        va = this.createVertex((yt - fb) / fm, yt);
                    }
                    else if (va.y >= yb) {
                        return false;
                    }
                    vb = this.createVertex((yb - fb) / fm, yb);
                }
                else {
                    if (!va || va.y > yb) {
                        va = this.createVertex((yb - fb) / fm, yb);
                    }
                    else if (va.y < yt) {
                        return false;
                    }
                    vb = this.createVertex((yt - fb) / fm, yt);
                }
            }
            else {
                // rightward
                if (ly < ry) {
                    if (!va || va.x < xl) {
                        va = this.createVertex(xl, fm * xl + fb);
                    }
                    else if (va.x >= xr) {
                        return false;
                    }
                    vb = this.createVertex(xr, fm * xr + fb);
                }
                else {
                    if (!va || va.x > xr) {
                        va = this.createVertex(xr, fm * xr + fb);
                    }
                    else if (va.x < xl) {
                        return false;
                    }
                    vb = this.createVertex(xl, fm * xl + fb);
                }
            }
            edge.va = va;
            edge.vb = vb;
            return true;
        }
        // line-clipping code taken from:
        //   Liang-Barsky function by Daniel White
        //   http://www.skytopia.com/project/articles/compsci/clipping.html
        // Thanks!
        // A bit modified to minimize code paths
        clipEdge(edge, bbox) {
            var ax = edge.va.x, ay = edge.va.y, bx = edge.vb.x, by = edge.vb.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay;
            // left
            var q = ax - bbox.xl;
            if (dx === 0 && q < 0) {
                return false;
            }
            var r = -q / dx;
            if (dx < 0) {
                if (r < t0) {
                    return false;
                }
                if (r < t1) {
                    t1 = r;
                }
            }
            else if (dx > 0) {
                if (r > t1) {
                    return false;
                }
                if (r > t0) {
                    t0 = r;
                }
            }
            // right
            q = bbox.xr - ax;
            if (dx === 0 && q < 0) {
                return false;
            }
            r = q / dx;
            if (dx < 0) {
                if (r > t1) {
                    return false;
                }
                if (r > t0) {
                    t0 = r;
                }
            }
            else if (dx > 0) {
                if (r < t0) {
                    return false;
                }
                if (r < t1) {
                    t1 = r;
                }
            }
            // top
            q = ay - bbox.yt;
            if (dy === 0 && q < 0) {
                return false;
            }
            r = -q / dy;
            if (dy < 0) {
                if (r < t0) {
                    return false;
                }
                if (r < t1) {
                    t1 = r;
                }
            }
            else if (dy > 0) {
                if (r > t1) {
                    return false;
                }
                if (r > t0) {
                    t0 = r;
                }
            }
            // bottom        
            q = bbox.yb - ay;
            if (dy === 0 && q < 0) {
                return false;
            }
            r = q / dy;
            if (dy < 0) {
                if (r > t1) {
                    return false;
                }
                if (r > t0) {
                    t0 = r;
                }
            }
            else if (dy > 0) {
                if (r < t0) {
                    return false;
                }
                if (r < t1) {
                    t1 = r;
                }
            }
            // if we reach this point, Voronoi edge is within bbox
            // if t0 > 0, va needs to change
            // rhill 2011-06-03: we need to create a new vertex rather
            // than modifying the existing one, since the existing
            // one is likely shared with at least another edge
            if (t0 > 0) {
                edge.va = this.createVertex(ax + t0 * dx, ay + t0 * dy);
            }
            // if t1 < 1, vb needs to change
            // rhill 2011-06-03: we need to create a new vertex rather
            // than modifying the existing one, since the existing
            // one is likely shared with at least another edge
            if (t1 < 1) {
                edge.vb = this.createVertex(ax + t1 * dx, ay + t1 * dy);
            }
            // va and/or vb were clipped, thus we will need to close
            // cells which use this edge.
            if (t0 > 0 || t1 < 1) {
                this.cells[edge.lSite.voronoiId].closeMe = true;
                this.cells[edge.rSite.voronoiId].closeMe = true;
            }
            return true;
        }
        // Connect/cut edges at bounding box
        clipEdges(bbox) {
            // connect all dangling edges to bounding box
            // or get rid of them if it can't be done
            var edges = this.edges, iEdge = edges.length, edge, abs_fn = Math.abs;
            // iterate backward so we can splice safely
            while (iEdge--) {
                edge = edges[iEdge];
                // edge is removed if:
                //   it is wholly outside the bounding box
                //   it is looking more like a point than a line
                if (!this.connectEdge(edge, bbox) ||
                    !this.clipEdge(edge, bbox) ||
                    (abs_fn(edge.va.x - edge.vb.x) < 1e-9 && abs_fn(edge.va.y - edge.vb.y) < 1e-9)) {
                    edge.va = edge.vb = null;
                    edges.splice(iEdge, 1);
                }
            }
        }
        // Close the cells.
        // The cells are bound by the supplied bounding box.
        // Each cell refers to its associated site, and a list
        // of halfedges ordered counterclockwise.
        closeCells(bbox) {
            var xl = bbox.xl, xr = bbox.xr, yt = bbox.yt, yb = bbox.yb, cells = this.cells, iCell = cells.length, cell, iLeft, halfedges, nHalfedges, edge, va, vb, vz, lastBorderSegment, abs_fn = Math.abs;
            while (iCell--) {
                cell = cells[iCell];
                // prune, order halfedges counterclockwise, then add missing ones
                // required to close cells
                if (!cell.prepareHalfedges()) {
                    continue;
                }
                if (!cell.closeMe) {
                    continue;
                }
                // find first 'unclosed' point.
                // an 'unclosed' point will be the end point of a halfedge which
                // does not match the start point of the following halfedge
                halfedges = cell.halfedges;
                nHalfedges = halfedges.length;
                // special case: only one site, in which case, the viewport is the cell
                // ...
                // all other cases
                iLeft = 0;
                while (iLeft < nHalfedges) {
                    va = halfedges[iLeft].getEndpoint();
                    vz = halfedges[(iLeft + 1) % nHalfedges].getStartpoint();
                    // if end point is not equal to start point, we need to add the missing
                    // halfedge(s) up to vz
                    if (abs_fn(va.x - vz.x) >= 1e-9 || abs_fn(va.y - vz.y) >= 1e-9) {
                        // rhill 2013-12-02:
                        // "Holes" in the halfedges are not necessarily always adjacent.
                        // https://github.com/gorhill/Javascript-Voronoi/issues/16
                        // find entry point:
                        switch (true) {
                            // walk downward along left side
                            case this.equalWithEpsilon(va.x, xl) && this.lessThanWithEpsilon(va.y, yb):
                                lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
                                vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                            // fall through
                            // walk rightward along bottom side
                            case this.equalWithEpsilon(va.y, yb) && this.lessThanWithEpsilon(va.x, xr):
                                lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
                                vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                            // fall through
                            // walk upward along right side
                            case this.equalWithEpsilon(va.x, xr) && this.greaterThanWithEpsilon(va.y, yt):
                                lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
                                vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                            // fall through
                            // walk leftward along top side
                            case this.equalWithEpsilon(va.y, yt) && this.greaterThanWithEpsilon(va.x, xl):
                                lastBorderSegment = this.equalWithEpsilon(vz.y, yt);
                                vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                                // fall through
                                // walk downward along left side
                                lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
                                vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                                // fall through
                                // walk rightward along bottom side
                                lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
                                vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                                va = vb;
                                // fall through
                                // walk upward along right side
                                lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
                                vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                                edge = this.createBorderEdge(cell.site, va, vb);
                                iLeft++;
                                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                                nHalfedges++;
                                if (lastBorderSegment) {
                                    break;
                                }
                            // fall through
                            default:
                                throw "Voronoi.closeCells() > this makes no sense!";
                        }
                    }
                    iLeft++;
                }
                cell.closeMe = false;
            }
        }
        // ---------------------------------------------------------------------------
        // Debugging helper
        /*
        Voronoi.prototype.dumpBeachline = function(y) {
            console.log('Voronoi.dumpBeachline(%f) > Beachsections, from left to right:', y);
            if ( !this.beachline ) {
                console.log('  None');
                }
            else {
                var bs = this.beachline.getFirst(this.beachline.root);
                while ( bs ) {
                    console.log('  site %d: xl: %f, xr: %f', bs.site.voronoiId, this.leftBreakPoint(bs, y), this.rightBreakPoint(bs, y));
                    bs = bs.rbNext;
                    }
                }
            };
        */
        // ---------------------------------------------------------------------------
        // Helper: Quantize sites
        // rhill 2013-10-12:
        // This is to solve https://github.com/gorhill/Javascript-Voronoi/issues/15
        // Since not all users will end up using the kind of coord values which would
        // cause the issue to arise, I chose to let the user decide whether or not
        // he should sanitize his coord values through this helper. This way, for
        // those users who uses coord values which are known to be fine, no overhead is
        // added.
        quantizeSites(sites) {
            var ε = Voronoi.ε, n = sites.length, site;
            while (n--) {
                site = sites[n];
                site.x = Math.floor(site.x / ε) * ε;
                site.y = Math.floor(site.y / ε) * ε;
            }
        }
        // ---------------------------------------------------------------------------
        // Helper: Recycle diagram: all vertex, edge and cell objects are
        // "surrendered" to the Voronoi object for reuse.
        // TODO: rhill-voronoi-core v2: more performance to be gained
        // when I change the semantic of what is returned.
        recycle(diagram) {
            if (diagram) {
                this.toRecycle = diagram;
            }
        }
        // ---------------------------------------------------------------------------
        // Top-level Fortune loop
        // rhill 2011-05-19:
        //   Voronoi sites are kept client-side now, to allow
        //   user to freely modify content. At compute time,
        //   *references* to sites are copied locally.
        compute(sites, bbox) {
            // to measure execution time
            var startTime = new Date();
            // init internal state
            this.reset();
            // any diagram data available for recycling?
            // I do that here so that this is included in execution time
            if (this.toRecycle) {
                this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
                this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
                this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
                this.toRecycle = null;
            }
            // Initialize site event queue
            var siteEvents = sites.slice(0);
            siteEvents.sort(function (a, b) {
                var r = b.y - a.y;
                if (r) {
                    return r;
                }
                return b.x - a.x;
            });
            // process queue
            var site = siteEvents.pop(), siteid = 0, xsitex, // to avoid duplicate sites
            xsitey, cells = this.cells, circle;
            // main loop
            for (;;) {
                // we need to figure whether we handle a site or circle event
                // for this we find out if there is a site event and it is
                // 'earlier' than the circle event
                circle = this.firstCircleEvent;
                // add beach section
                if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
                    // only if site is not a duplicate
                    if (site.x !== xsitex || site.y !== xsitey) {
                        // first create cell for new site
                        cells[siteid] = this.createCell(site);
                        site.voronoiId = siteid++;
                        // then create a beachsection for that site
                        this.addBeachsection(site);
                        // remember last site coords to detect duplicate
                        xsitey = site.y;
                        xsitex = site.x;
                    }
                    site = siteEvents.pop();
                }
                else if (circle) {
                    this.removeBeachsection(circle.arc);
                }
                else {
                    break;
                }
            }
            // wrapping-up:
            //   connect dangling edges to bounding box
            //   cut edges as per bounding box
            //   discard edges completely outside bounding box
            //   discard edges which are point-like
            this.clipEdges(bbox);
            //   add missing edges in order to close opened cells
            this.closeCells(bbox);
            // to measure execution time
            var stopTime = new Date();
            // prepare return values
            var diagram = new Diagram();
            diagram.cells = this.cells;
            diagram.edges = this.edges;
            diagram.vertices = this.vertices;
            diagram.execTime = stopTime.getTime() - startTime.getTime();
            // clean up
            this.reset();
            return diagram;
        }
    }
    Voronoi.ε = 1e-9;
    Voronoi.invε = 1.0 / Voronoi.ε;
    exports.Voronoi = Voronoi;
});
/******************************************************************************/
// if ( typeof module !== 'undefined' ) {
//     module.exports = Voronoi;
// }
// // var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
// var sites = [<Site>{x:25,y:50}, <Site>{x:75,y:50}/*, <Site>{x:50,y:80}*/];
// // xl, xr means x left, x right
// // yt, yb means y top, y bottom
// var bbox = <BBox>{xl:0, xr:100, yt:0, yb:100};
// var voronoi = new Voronoi();
// // pass an object which exhibits xl, xr, yt, yb properties. The bounding
// // box will be used to connect unbound edges, and to close open cells
// let result = voronoi.compute(sites, bbox);
// console.log(sites)
// console.log(result.cells[0].halfedges)
// for (let e of result.edges)
// {
//     console.log(e)
// }
define("RNG", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RNG {
        constructor(seed) {
            // faster than added uniform 
            this.haveNextNextGaussian = false;
            this.nextNextGaussian = 0;
            if (seed)
                this.seed = seed;
            else
                this.seed = Math.random() * 9999999999;
        }
        next(min, max) {
            max = max || 0;
            min = min || 0;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233279;
            return min + rnd * (max - min);
        }
        // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        nextInt(min, max) {
            return Math.floor(this.next(min, max));
        }
        nextDouble() {
            return this.next(0, 1);
        }
        range(a, b) {
            return this.next(a, b + 1);
        }
        chance(ch) {
            return this.nextDouble() < ch;
        }
        pick(collection) {
            return collection[this.nextInt(0, collection.length)];
        }
        pickW(collection, wts) {
            if (collection.length != wts.length)
                return undefined;
            var s = 0;
            for (var w of wts)
                s += w;
            let ch = this.nextDouble() * s;
            for (var i = 0; i < collection.length; i++) {
                if (ch < wts[i])
                    return collection[i];
                ch -= wts[i];
            }
            return undefined;
        }
        shuffle(arr) {
            for (let i = 0; i < arr.length; i++) {
                let j = this.nextInt(0, arr.length);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
        nextGaussian() {
            // See Knuth, ACP, Section 3.4.1 Algorithm C.
            if (this.haveNextNextGaussian) {
                this.haveNextNextGaussian = false;
                return this.nextNextGaussian;
            }
            else {
                var v1, v2, s;
                do {
                    v1 = 2 * this.nextDouble() - 1; // between -1 and 1
                    v2 = 2 * this.nextDouble() - 1; // between -1 and 1
                    s = v1 * v1 + v2 * v2;
                } while (s >= 1 || s == 0);
                let multiplier = Math.sqrt(-2 * Math.log(s) / s);
                this.nextNextGaussian = v2 * multiplier;
                this.haveNextNextGaussian = true;
                return v1 * multiplier;
            }
        }
    }
    exports.RNG = RNG;
});
define("SVG", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function SVGReset() {
        Shape.resetId();
        LinearGradient.resetId();
    }
    exports.SVGReset = SVGReset;
    class Stop {
        constructor(offset, col, opacity = undefined) {
            this.opacity = undefined;
            this.offset = offset;
            this.col = col;
            this.opacity = opacity;
        }
        toSVG() {
            return "<stop stop-color=\"" + this.col + "\""
                + ((this.opacity != undefined) ? " stop-opacity=\"" + this.opacity + "\"" : "")
                + " offset=\"" + this.offset + "\"/>";
        }
    }
    exports.Stop = Stop;
    class Grad {
        constructor() {
            this.stops = [];
            this.isUserSpace = false;
            this.nm = "unnamed";
        }
        addStop(offset, col, opacity = undefined) {
            this.stops.push(new Stop(offset, col, opacity));
        }
    }
    exports.Grad = Grad;
    class LinearGradient extends Grad {
        constructor(x1, y1, x2, y2) {
            super();
            this.nm = "LG" + LinearGradient.id;
            LinearGradient.id++;
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        copy() {
            let lg = new LinearGradient(this.x1, this.y1, this.x2, this.y2);
            lg.stops = this.stops;
            lg.isUserSpace = this.isUserSpace;
            return lg;
        }
        static resetId() {
            LinearGradient.id = 0;
        }
        toSVG() {
            return "<linearGradient id=\"" + this.nm + "\" x1=\"" + this.x1 + "\" x2=\"" + this.x2
                + "\" y1=\"" + this.y1 + "\" y2=\"" + this.y2 + "\"" + (this.isUserSpace ? " gradientUnits=\"userSpaceOnUse\"" : "") + ">\n"
                + this.stops.map(x => x.toSVG()).join("\n")
                + "\n</linearGradient>";
        }
    }
    LinearGradient.id = 1;
    exports.LinearGradient = LinearGradient;
    class Shape {
        constructor() {
            this.cls = undefined;
            this.trans = "";
            this.fill = undefined;
            this.filter = undefined;
            this.opacity = undefined;
            this.refName = undefined;
            this.nm = "SHP" + Shape.id;
            Shape.id++;
        }
        static resetId() {
            Shape.id = 0;
        }
        toSVGSub() {
            let isFillGrad = (this.fill instanceof Grad);
            return (this.nm != null ? (" id=\"" + this.nm + "\"") : "")
                + (this.cls ? (" class=\"" + this.cls + "\"") : "")
                + (this.trans.length > 0 ? (" transform=\"" + this.trans + "\"") : "")
                + (this.fill ? (" fill=\"" +
                    (isFillGrad ? "url(#" + this.fill.nm + ")" : this.fill)
                    + "\"") : "")
                + (this.filter ? (" filter=\"url(#" + this.filter + ")\"") : "")
                + (this.opacity ? (" fill-opacity=\"" + this.opacity + "\"") : "")
                + (this.strokeColor ? (" stroke=\"" + this.strokeColor + "\"") : "")
                + (this.strokeWidth ? (" stroke-width=\"" + this.strokeWidth + "\"") : "")
                + (this.opacity && this.strokeColor ? (" stroke-opacity=\"" + this.opacity + "\"") : "")
                + (this.clip ? (" clip-path=\"url(#" + this.clip.nm + ")\"") : "");
        }
        setClip(shp) {
            if (shp == null) {
                this.clip = undefined;
                return;
            }
            this.clip = new Clip(shp);
        }
        collectDefs(clips, shrefs, grads) {
            if (this.clip) {
                clips[this.nm] = this.clip;
                shrefs[this.clip.ref.nm] = this.clip.ref;
            }
            if (this.fill instanceof Grad) {
                grads[this.fill.nm] = this.fill;
            }
            if (this.strokeColor instanceof Grad) {
                grads[this.strokeColor.nm] = this.strokeColor;
            }
        }
        translate(x, y = undefined) {
            this.trans += "translate(" + x + " " + (y ? y : "") + ") ";
        }
        rotate(a, x = undefined, y = undefined) {
            this.trans += "rotate(" + a + " " + (x ? x : "") + " " + (x ? y : "") + ") ";
        }
        scale(x, y = undefined) {
            this.trans += "scale(" + x + " " + (y ? y : "") + ") ";
        }
    }
    Shape.id = 1;
    exports.Shape = Shape;
    class Clip {
        constructor(ref) {
            this.nm = "CC" + Clip.id1;
            Clip.id1++;
            this.ref = ref;
        }
        toSVG() {
            let rf = new ShapeRef(this.ref);
            rf.nm = null;
            let s = "";
            s += "<clipPath id=\"" + this.nm + "\">\n";
            let cren = [];
            Clip.collectChildren(this.ref, cren);
            cren.forEach(c => { rf.ref = c; s += rf.toSVG(); });
            s += "\n</clipPath>\n";
            return s;
        }
        // Ugly colution to flatten groups for clipping
        static collectChildren(s, names) {
            if (s instanceof SVGGroup) {
                s.children.forEach(c => this.collectChildren(c, names));
            }
            else
                names.push(s);
        }
    }
    Clip.id1 = 1;
    exports.Clip = Clip;
    class SVGGroup extends Shape {
        constructor() {
            super();
            this.children = [];
        }
        add(child) {
            this.children.push(child);
        }
        collectDefs(clips, shrefs, grads) {
            super.collectDefs(clips, shrefs, grads);
            // TODO: for grads!!!
            //if (fill)
            this.children.forEach(x => x.collectDefs(clips, shrefs, grads));
        }
        toSVG() {
            let s = "<g " + this.toSVGSub() + ">\n";
            this.children.forEach(element => {
                s += element.toSVG() + "\n";
            });
            s += "</g>";
            return s;
        }
    }
    exports.SVGGroup = SVGGroup;
    class SVGRoot extends SVGGroup {
        constructor(w, h) {
            super();
            this.attrExtra = null;
            this.w = w;
            this.h = h;
        }
        toSVG() {
            let clips = {};
            let shrefs = {};
            let grads = {};
            this.collectDefs(clips, shrefs, grads);
            let s = "";
            s += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + this.w + "\" height=\"" + this.h + "\"";
            if (this.id)
                s += " id=\"" + this.id + "\"";
            if (this.attrExtra)
                s += " " + this.attrExtra;
            s += ">\n";
            s += "<defs>\n";
            if (this.defExtra)
                s += this.defExtra + "\n";
            if (Object.keys(grads).length > 0) {
                Object.keys(grads).forEach(nm => { s += grads[nm].toSVG() + "\n"; /*console.log("CALLED "+nm);*/ });
            }
            if (Object.keys(shrefs).length > 0) {
                Object.keys(shrefs).forEach(nm => { s += shrefs[nm].toSVG() + "\n"; /*console.log("CALLED "+nm);*/ });
            }
            s += "\n";
            if (Object.keys(clips).length > 0) {
                Object.keys(clips).forEach(nm => {
                    s += clips[nm].toSVG() + "\n";
                });
            }
            // TODO!!! grads
            s += "</defs>\n";
            s += super.toSVG();
            s += "\n</svg>";
            return s;
        }
    }
    exports.SVGRoot = SVGRoot;
    class ShapeRef extends Shape {
        constructor(ref) {
            super();
            this.ref = ref;
        }
        collectDefs(clips, shrefs, grads) {
            super.collectDefs(clips, shrefs, grads);
            shrefs[this.ref.nm] = this.ref;
        }
        toSVG() {
            // x="" y=""
            return "<use xlink:href=\"#" + this.ref.nm + "\"" + this.toSVGSub() + "/>";
        }
    }
    exports.ShapeRef = ShapeRef;
    class Rect extends Shape {
        constructor(x = 0, y = 0, w = 0, h = 0, cls = undefined) {
            super();
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<rect x=\"" + this.x + "\" y=\"" + this.y + "\" width=\"" + this.w + "\" height=\"" + this.h + "\" " +
                this.toSVGSub()
                + " />";
        }
    }
    exports.Rect = Rect;
    class Circ extends Shape {
        constructor(cx, cy, r, r2 = undefined, cls = undefined) {
            super();
            this.cx = cx;
            this.cy = cy;
            this.rx = r;
            this.ry = r2 ? r2 : r;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<ellipse cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" rx=\"" + this.rx + "\" ry=\"" + this.ry + "\" " +
                this.toSVGSub()
                + " />";
        }
    }
    exports.Circ = Circ;
    class Circle extends Shape {
        constructor(cx = 0, cy = 0, r = 0, cls = undefined) {
            super();
            this.cx = cx;
            this.cy = cy;
            this.r = r;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<circle cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" r=\"" + this.r + "\" " +
                this.toSVGSub()
                + " />";
        }
    }
    exports.Circle = Circle;
    class CPoly extends Shape {
        constructor() {
            super();
            this.closed = true;
            this.x = [];
            this.y = [];
        }
        add(x, y) {
            this.x.push(x);
            this.y.push(y);
        }
        toSVG() {
            if (this.x.length == 0)
                return "";
            let s = "<path d=\"";
            s += "M " + this.x[0] + "," + this.y[0] + " ";
            for (let i = 1; i < this.x.length; i++) {
                s += "L " + this.x[i] + "," + this.y[i] + " ";
            }
            if (this.closed)
                s += "Z";
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        }
        static makeRegPoly(n, cx = 0, cy = 0, r = 1, rotDeg = -90) {
            let ret = new CPoly();
            let ang = Math.PI * 2 / n;
            let alpha = rotDeg * Math.PI / 180;
            for (let i = 0; i < n; i++) {
                ret.add(cx + r * Math.cos(ang * i + alpha), cy + r * Math.sin(ang * i + alpha));
            }
            return ret;
        }
    }
    exports.CPoly = CPoly;
    class Line extends Shape {
        constructor(x1, y1, x2, y2) {
            super();
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.closed = true;
        }
        toSVG() {
            let t = this;
            let s = `<line x1="${t.x1}" y1="${t.y1}" x2="${t.x2}" y2="${t.y2}" `;
            if (this.markerEnd)
                s += ` marker-end="url(#${this.markerEnd})" `;
            s += this.toSVGSub() + "/>";
            return s;
        }
    }
    exports.Line = Line;
    class LineSegs extends Shape {
        constructor() {
            super();
            this.closed = true;
            this.x1 = [];
            this.y1 = [];
            this.x2 = [];
            this.y2 = [];
        }
        add(x1, y1, x2, y2) {
            this.x1.push(x1);
            this.y1.push(y1);
            this.x2.push(x2);
            this.y2.push(y2);
        }
        toSVG() {
            if (this.x1.length == 0)
                return "";
            let s = "<path d=\"";
            for (let i = 0; i < this.x1.length; i++) {
                s += "M" + this.x1[i] + "," + this.y1[i] +
                    "L" + this.x2[i] + "," + this.y2[i] + " ";
            }
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        }
    }
    exports.LineSegs = LineSegs;
    class SVGText extends Shape {
        constructor(str, x, y) {
            super();
            this.str = str;
            this.x = x;
            this.y = y;
        }
        toSVG() {
            let s = "<text x=\"" + this.x + "\" y=\"" + this.y +
                "\" " + this.toSVGSub() + ">\n";
            s += this.str;
            s += "</text>";
            return s;
        }
    }
    exports.SVGText = SVGText;
    function makeStripedRect(x, y, w, h, N, gapFrac, isVert) {
        let sum = 0;
        for (let i = 0; i < N; i++) {
            if (i > 0)
                sum += gapFrac;
            sum += 1;
        }
        let d = (1 + gapFrac) / sum;
        let g = new SVGGroup();
        if (isVert) {
            let sw = w / sum;
            for (let i = 0; i < N; i++) {
                let x1 = x + i * d * w;
                let r = new Rect(x1, y, sw, h);
                g.add(r);
            }
        }
        else {
            let sh = h / sum;
            for (let i = 0; i < N; i++) {
                let y1 = y + i * d * h;
                let r = new Rect(x, y1, w, sh);
                g.add(r);
            }
        }
        return g;
    }
    exports.makeStripedRect = makeStripedRect;
    class Vec2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        len() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        perp() {
            return new Vec2(this.y, -this.x);
        }
        inPlaceUnit() {
            let l = this.len();
            this.x /= l;
            this.y /= l;
        }
    }
    exports.Vec2 = Vec2;
});
define("mycolor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Color {
        normalize() {
            this.red = Math.max(0, Math.min(1, this.red));
            this.green = Math.max(0, Math.min(1, this.green));
            this.blue = Math.max(0, Math.min(1, this.blue));
        }
        static to2bHex(val) {
            let s = ("0" + Math.round(val * 255).toString(16).toUpperCase());
            return s.substr(s.length - 2);
        }
        toHex() {
            this.normalize();
            return "#" + Color.to2bHex(this.red) + Color.to2bHex(this.green) + Color.to2bHex(this.blue);
        }
    }
    exports.Color = Color;
    function hsbToRGB(hue, saturation, value) {
        hue -= Math.floor(hue);
        hue *= 360;
        hue %= 360;
        saturation = Math.min(Math.max(0, saturation), 1);
        value = Math.min(1, Math.max(0, value));
        //            alpha = Math.min(1, Math.max(0, this.alpha));
        let rgb = new Color();
        var i;
        var f, p, q, t;
        if (saturation === 0) {
            // achromatic (grey)
            rgb.red = value;
            rgb.green = value;
            rgb.blue = value;
            //        rgb.alpha = this.alpha;
            return rgb;
        }
        var h = hue / 60; // sector 0 to 5
        i = Math.floor(h);
        f = h - i; // factorial part of h
        p = value * (1 - saturation);
        q = value * (1 - saturation * f);
        t = value * (1 - saturation * (1 - f));
        switch (i) {
            case 0:
                rgb.red = value;
                rgb.green = t;
                rgb.blue = p;
                break;
            case 1:
                rgb.red = q;
                rgb.green = value;
                rgb.blue = p;
                break;
            case 2:
                rgb.red = p;
                rgb.green = value;
                rgb.blue = t;
                break;
            case 3:
                rgb.red = p;
                rgb.green = q;
                rgb.blue = value;
                break;
            case 4:
                rgb.red = t;
                rgb.green = p;
                rgb.blue = value;
                break;
            default:// case 5:
                rgb.red = value;
                rgb.green = p;
                rgb.blue = q;
                break;
        }
        //            rgb.alpha = this.alpha;
        return rgb;
    }
    exports.hsbToRGB = hsbToRGB;
});
define("Perlin", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Perlin {
        static noise(x, y, z) {
            let P = Perlin;
            let X = Math.floor(x) & 255, // FIND UNIT CUBE THAT
            Y = Math.floor(y) & 255, // CONTAINS POINT.
            Z = Math.floor(z) & 255;
            x -= Math.floor(x); // FIND RELATIVE X,Y,Z
            y -= Math.floor(y); // OF POINT IN CUBE.
            z -= Math.floor(z);
            let u = Perlin.fade(x), // COMPUTE FADE CURVES
            v = Perlin.fade(y), // FOR EACH OF X,Y,Z.
            w = Perlin.fade(z);
            let A = Perlin.p[X] + Y, AA = Perlin.p[A] + Z, AB = Perlin.p[A + 1] + Z, // HASH COORDINATES OF
            B = Perlin.p[X + 1] + Y, BA = Perlin.p[B] + Z, BB = Perlin.p[B + 1] + Z; // THE 8 CUBE CORNERS,
            return P.lerp(w, P.lerp(v, P.lerp(u, P.grad(P.p[AA], x, y, z), // AND ADD
            P.grad(P.p[BA], x - 1, y, z)), // BLENDED
            P.lerp(u, P.grad(P.p[AB], x, y - 1, z), // RESULTS
            P.grad(P.p[BB], x - 1, y - 1, z))), // FROM  8
            P.lerp(v, P.lerp(u, P.grad(P.p[AA + 1], x, y, z - 1), // CORNERS
            P.grad(P.p[BA + 1], x - 1, y, z - 1)), // OF CUBE
            P.lerp(u, P.grad(P.p[AB + 1], x, y - 1, z - 1), P.grad(P.p[BB + 1], x - 1, y - 1, z - 1))));
        }
        static fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        static lerp(t, a, b) { return a + t * (b - a); }
        static grad(hash, x, y, z) {
            let h = hash & 15; // CONVERT LO 4 BITS OF HASH CODE
            let u = h < 8 ? x : y, // INTO 12 GRADIENT DIRECTIONS.
            v = h < 4 ? y : h == 12 || h == 14 ? x : z;
            return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
        }
    }
    // Note: not necessary to use this particular permutation
    Perlin.p = [
        151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
        // Copy
        151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];
    exports.Perlin = Perlin;
    class PNoise {
        constructor(rand, scalex = 1, scaley = scalex, octaves = 1) {
            this.dx = [];
            this.dy = [];
            this.scalex = 1;
            this.scaley = 1;
            this.octaves = 1;
            this.max = 1;
            this.scalex = scalex;
            this.scaley = scaley;
            this.octaves = octaves;
            this.max = 0;
            let s = 1;
            for (let i = 0; i < octaves; i++) {
                this.dx.push(rand.nextDouble() * 255);
                this.dy.push(rand.nextDouble() * 255);
                this.max += s;
                s *= .5;
            }
        }
        noise(x, y) {
            let s = 0, nscale = 1, xscale = 1;
            for (let i = 0; i < this.octaves; i++) {
                s += Perlin.noise(x * xscale * this.scalex + this.dx[i], y * xscale * this.scaley + this.dy[i], 
                /*.5*/ 0) * nscale;
                xscale *= 2;
                nscale *= .5;
            }
            s = (s + this.max) / this.max / 2;
            // s /= this.max
            return s;
        }
    }
    exports.PNoise = PNoise;
    const IR2 = .707; // 1/root_2
    class TiledNoise {
        constructor(rand, tileX, tileY) {
            this.tileX = tileX;
            this.tileY = tileY;
            let p1 = new Array(256);
            for (let i = 0; i < 256; i++)
                p1[i] = i;
            rand.shuffle(p1);
            this.perm = new Array(512);
            for (let i = 0; i < 256; i++)
                this.perm[i] = this.perm[256 + i] = p1[i];
        }
        surflet(x, y, intX, intY, gridX, gridY) {
            let distX = Math.abs(x - gridX);
            let distY = Math.abs(y - gridY);
            let polyX = 1 - 6 * distX ** 5 + 15 * distX ** 4 - 10 * distX ** 3;
            let polyY = 1 - 6 * distY ** 5 + 15 * distY ** 4 - 10 * distY ** 3;
            let hashed = this.perm[this.perm[gridX % this.tileX] + gridY % this.tileY];
            hashed = (hashed % TiledNoise.ndirs) * 2;
            let grad = (x - gridX) * TiledNoise.dirs[hashed]
                + (y - gridY) * TiledNoise.dirs[hashed + 1];
            return polyX * polyY * grad;
        }
        noise2(x, y) {
            let intX = Math.floor(x);
            let intY = Math.floor(y);
            return (this.surflet(x, y, intX, intY, intX + 0, intY + 0) +
                this.surflet(x, y, intX, intY, intX + 1, intY + 0) +
                this.surflet(x, y, intX, intY, intX + 0, intY + 1) +
                this.surflet(x, y, intX, intY, intX + 1, intY + 1));
        }
    }
    TiledNoise.dirs = [-1, -1, 1, -1, 1, 1, -1, 1,
        0, 1, 0, -1, 1, 0, -1, 0];
    TiledNoise.ndirs = 8;
    exports.TiledNoise = TiledNoise;
    class TiledPerlin {
        noise2(x, y, tileX, tileY) {
            let P = Perlin, t = this, TP = TiledPerlin;
            let X = Math.floor(x), // FIND UNIT CUBE THAT
            Y = Math.floor(y); // CONTAINS POINT.
            x -= X; // FIND RELATIVE X,Y,Z
            y -= Y; // OF POINT IN CUBE.
            let X1 = (X + 1) % tileX, Y1 = (Y + 1) % tileY;
            X %= tileX;
            Y %= tileY;
            let u = P.fade(x), // COMPUTE FADE CURVES
            v = P.fade(y); // FOR EACH OF X,Y,Z.
            // HASH COORDINATES OF // THE 8 CUBE CORNERS,
            let A = t.p[X], AA = t.p[A + Y], // X Y
            AB = t.p[A + Y1], // X Y+1
            B = t.p[X1], BA = t.p[B + Y], // X+1 Y
            BB = t.p[B + Y1]; // X+1 Y+1
            // Add blended results from all corners
            return P.lerp(v, P.lerp(u, TP.grad(t.p[AA], x, y), // AND ADD
            TP.grad(t.p[BA], x - 1, y)), // BLENDED
            P.lerp(u, TP.grad(t.p[AB], x, y - 1), // RESULTS
            TP.grad(t.p[BB], x - 1, y - 1))); // FROM  8
        }
        //    static fade(t:number) { return t * t * t * (t * (t * 6 - 15) + 10); }
        //    static lerp(t:number, a:number, b:number) { return a + t * (b - a); }
        static grad(hash, x, y) {
            // CONVERT LO 3 BITS OF HASH CODE // INTO 8 GRADIENT DIRECTIONS.
            let h = hash & 7;
            var u, v;
            if (h < 4) {
                u = x;
                v = y;
            }
            else {
                u = 0;
                v = (h & 1) ? x : y;
            }
            return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
        }
        constructor(rand) {
            let p1 = new Array(256);
            for (let i = 0; i < 256; i++)
                p1[i] = i;
            rand.shuffle(p1);
            this.p = new Array(512);
            for (let i = 0; i < 256; i++)
                this.p[i] = this.p[256 + i] = p1[i];
        }
    }
    exports.TiledPerlin = TiledPerlin;
    class TiledOctNoise {
        constructor(rand, scalex = 1, scaley = scalex, tile = 256, octaves = 1) {
            this.tile = tile;
            this.dx = [];
            this.dy = [];
            this.scalex = 1;
            this.scaley = 1;
            this.octaves = 1;
            this.max = 1;
            this.scalex = scalex;
            this.scaley = scaley;
            this.octaves = octaves;
            this.tile = Math.floor(this.tile);
            this.max = 0;
            let s = 1;
            for (let i = 0; i < octaves; i++) {
                this.dx.push(rand.nextDouble() * this.tile);
                this.dy.push(rand.nextDouble() * this.tile);
                this.max += s;
                s *= .5;
            }
            // this.dx[0] = this.dy[0] = .4//SID_DEBUG
            this.n_ = new TiledPerlin(rand);
        }
        noise(x, y) {
            let s = 0, nscale = 1, xscale = 1, tile = this.tile;
            let n_ = this.n_;
            for (let i = 0; i < this.octaves; i++) {
                s += n_.noise2(x * xscale * this.scalex + this.dx[i], y * xscale * this.scaley + this.dy[i], tile, tile) * nscale;
                xscale *= 2;
                nscale *= .5;
                tile <<= 1;
            }
            s = (s + this.max) / this.max / 2;
            // s /= this.max
            return s;
        }
    }
    exports.TiledOctNoise = TiledOctNoise;
});
// let rand = new RNG()
// for (let i = 0; i < 100; i++)
// {
//     let j = rand.nextInt(0, 255)
//     console.log(j, Perlin.grad(j, 1, 1, 1))
// }
// console.log(211, Perlin.grad(211, 1, 1, 1))
// ************ Calculate Sanity, Average
// let max = -Infinity, min = Infinity
// // console.log(Perlin.p.length)
// let y = 0, z = .5;
// z = 1;
// let sum = 0, ct = 0;
// let pn = new PNoise(new RNG(), 1, 1, 5)
// for (let x = -1; x < 1; x+=.001)
// for (y = -20; y < 20; y+=.001)
// // for (z = -2; z < 4; z+=.01)
// {
//     // let n = Perlin.noise(x, y, z)
//     let n = pn.noise(x, y);
//     if (n < min) min = n
//     if ( n > max) max = n
//     sum += n
//     ct++
// }
// console.log(min, max)
// console.log(sum, ct, sum/ct)
// Test by creating SVG with lots of rect pixels
// const W = 400
// let r = new SVGRoot(W, W);
// let rand = new RNG()
// let per = 2
// // let nn = new PNoise(rand, 2, 2, 5)
// // let nn = new TiledNoise(rand, 2, 2)
// // let nn = new TPer(rand)
// let nn = new PNoise2(rand, 1, 1, 2, 3)
// let D = .01
// for (let x = 0; x < 1; x+=D)
// for (let y = 0; y < 1; y+=D)
// // for (z = -2; z < 4; z+=.01)
// {
//     let x1 = x * 2, y1 = y * 2
//     if (x1 > 1) x1 -= 1
//     if (y1 > 1) y1 -= 1
//     // let n = Perlin.noise(x*8 + 1.1, y*8 + 2.3, .5)
//     // let n = nn.noise(x, y)
//     let n = nn.noise(x1*per, y1*per)
// // if (n == NaN) console.log ("ER")
// // if (n < -1 || n > 1) console.log(n)
//     let a = new Rect(x*W, y*W, D*W, D*W)
//     // let clr = hsbToRGB(0, 0, (n+1)/2).toHex()
//     let clr = hsbToRGB(0, 0, n).toHex()
//     a.fill = clr
//     r.add(a)
// }
// console.log(r.toSVG())
// let t = new TiledNoise(new RNG(), 11, 4)
// for (let y = 0; y < 10; y++)
// {
//     let s = ""
//     for (let x = 0; x < 20; x++)
//     {
//         let h = (t.perm[t.perm[x%t.tileX] + y%t.tileY] %8)*2
//         s = s+" "+h+"/"+(TiledNoise.dirs[h]+TiledNoise.dirs[h+1])
//     }
//     console.log(s)
// }
// console.log(IR2, TiledNoise.dirs[14], TiledNoise.dirs[15])
// let T = new TPer(new RNG(), 2, 2)
// for (let x = 0; x < 3; x++)
//     for (let y = 0; y < 3; y++)
//     {
//         let x1 = x % 2
//         let y1 = y % 2
//         let h = T.p[T.p[x1]+y1]
//         h &= 7
//         if (h < 4)
//         {
//         }
//         let u = (h&1)?1: -1
//         let v = (h&2)?1: -1
//         console.log(x, y, h, u, v)
//     } 
define("MapSim", ["require", "exports", "rhill-voronoi-core", "RNG", "SVG", "mycolor", "Perlin"], function (require, exports, rhill_voronoi_core_1, RNG_1, SVG_1, mycolor_1, Perlin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let cc = console.log;
    function strToNum(a) {
        if (isNaN(a)) {
            let v = 1;
            for (let i = 0; i < a.length; i++) {
                let c = a.charCodeAt(i);
                v = (v * 31 + c * 127) % 999565999;
            }
            return v;
        }
        else {
            return a;
        }
    }
    class TimeKeeper {
        constructor() {
            this.first = -1;
            this.last = -1;
        }
        mark(msg) {
            let t = new Date().getTime();
            if (this.first == -1) {
                this.last = this.first = t;
                console.log("Start: " + msg);
                return;
            }
            else {
                console.log((t - this.last) + " " + (t - this.first) + " : " + msg);
                this.last = t;
                return;
            }
        }
    }
    class Queue {
        constructor(size) {
            this.size = 0;
            this.start = 0;
            this.count = 0;
            this.size = size;
            this.items = new Array(size);
        }
        clear() {
            for (let i = 0; i < this.size; i++) {
                this.items[i] = null;
            }
        }
        // clone() {
        //     return new Queue(...this.items);
        // }
        // contains(item) {
        //     return this.items.includes(item);
        // }
        peek() {
            var item = null;
            if (this.count > 0) {
                item = this.items[0];
            }
            return item;
        }
        dequeue() {
            if (this.count <= 0) {
                return null;
            }
            var removedItem = this.items[this.start];
            this.start = (this.start + 1) % this.size;
            // this.items[this.start] = null;// maybe slow    
            this.count--;
            return removedItem;
        }
        enqueue(item) {
            if (this.count >= this.size) {
                throw "Queue overflow!";
                // return
            }
            this.items[(this.start + this.count) % this.size] = item;
            this.count++;
            return item;
        }
    }
    var Biome;
    (function (Biome) {
        Biome[Biome["SEA"] = 0] = "SEA";
        Biome[Biome["GRASS"] = 1] = "GRASS";
        Biome[Biome["MOUNTAIN"] = 2] = "MOUNTAIN";
    })(Biome || (Biome = {}));
    class MSite extends rhill_voronoi_core_1.Site {
        constructor() {
            // Component based coordinates, not faster yet
            // id:number
            // static xarr
            // static yarr
            super(...arguments);
            this.polyx = null;
            this.polyy = null;
            this.plate = 0;
            this.isMapEdge = false;
            this.plateDist = [];
            this.biome = Biome.SEA;
            // Dint work much better
            // get x() {
            //     return MSite.xarr[this.id];
            // }
            // set x(v:number) {
            //     MSite.xarr[this.id] = v
            // }
            // get y() {
            //     return MSite.yarr[this.id];
            // }
            // set y(v:number) {
            //     MSite.yarr[this.id] = v
            // }
        }
        toString() {
            return "Site:" + this.voronoiId;
        }
    }
    class Plate {
        constructor() {
            // Plate attr
            this.clr = null;
            this.type = 0;
        }
    }
    class AdjListII {
        constructor() {
            // Vertices are ints
            this.edges = [];
            this.directional = false;
        }
        storeEdge(v1, v2) {
            let lst = this.edges[v1];
            if (!lst)
                lst = this.edges[v1] = [];
            if (lst.indexOf(v2) == -1)
                lst.push(v2);
            if (!this.directional) {
                lst = this.edges[v2];
                if (!lst)
                    lst = this.edges[v2] = [];
                if (lst.indexOf(v1) == -1)
                    lst.push(v1);
            }
        }
        isEdge(v1, v2) {
            let lst = this.edges[v1];
            return lst && lst.indexOf(v2) > -1;
        }
        removeEdge(v1, v2) {
            let lst = this.edges[v1];
            if (lst)
                this.removeElem(lst, v2);
            if (!this.directional) {
                lst = this.edges[v2];
                if (lst)
                    this.removeElem(lst, v1);
            }
        }
        removeElem(arr, val) {
            let idx = arr.indexOf(val);
            if (idx > -1)
                arr.splice(idx, 1);
        }
    }
    class AdjMat {
        constructor() {
            this.edges = [];
            this.directional = false;
        }
        storeEdge(v1, v2, wt) {
            let lst = this.edges[v1];
            if (wt != 0)
                wt = wt || 1;
            if (!lst)
                lst = this.edges[v1] = [];
            lst[v2] = wt;
            if (!this.directional) {
                lst = this.edges[v2];
                if (!lst)
                    lst = this.edges[v2] = [];
                lst[v1] = wt;
            }
        }
        isEdge(v1, v2) {
            let lst = this.edges[v1];
            return lst && lst[v2];
        }
        getWeight(v1, v2) {
            let lst = this.edges[v1];
            if (!lst || !lst[v2])
                return undefined;
            return lst[v2];
        }
        removeEdge(v1, v2) {
            let lst = this.edges[v1];
            if (lst)
                delete lst[v2];
            if (!this.directional) {
                lst = this.edges[v2];
                if (lst)
                    delete lst[v1];
            }
        }
    }
    class ArrSet {
        constructor() {
            this.arr = [];
        }
        add(v) {
            for (let v1 of this.arr)
                if (v1 === v)
                    return;
            this.arr.push(v);
        }
    }
    // Voronoi vert, vertices of the polygons in voronoi
    class VVert {
        constructor(v) {
            this.sites = new ArrSet();
            this.id = VVert._id++;
            this.x = v.x;
            this.y = v.y;
        }
        isEq(v) {
            return this.x == v.x && this.y == v.y;
        }
    }
    VVert._id = 1;
    function clamp(val, min, max) {
        if (val < min)
            return min;
        else if (val > max)
            return max;
        else
            return val;
    }
    let generateTerrain = window['generateTerrain'] = function (ctx) {
        // const NSITES = 5000
        // const NPLATES = 150
        // const NSITES = 10000
        // const NPLATES = 200
        // const NSITES = 20
        // const NPLATES = 5
        // const LAND_PLATE_CHANCE = .35
        // const MOUNTAIN_CHANCE = .15
        const POLE_LESS_POINTS = false; // Expt later, not pretty yet
        // const PLATE_PERTURB_AMP = .05//.05
        // const PLATE_PERTURB_FREQ = 15//10
        // const HT_SMOOTH = .2
        // const HT_SMOOTH_TIMES = 3
        const T_MAX = 1;
        const T_LAT_FACTOR = 1.1; // T goes 1 in eq to 0 in poles
        const T_HT_FACTOR = 1.1; // T goes 1 at bottom to 0 at 1ht which is max ht
        const T_LAND_HOTTER = .3;
        // const LLOYD_COUNT = 2
        const SIMW = 1.5;
        let NSITES = ctx["NSITES"];
        const LLOYD_COUNT = ctx["LLOYD_COUNT"];
        const NPLATES = ctx["NPLATES"];
        const PLATE_SEED = strToNum(ctx["PLATE_SEED"]);
        const LAND_PLATE_CHANCE = ctx["LAND_PLATE_CHANCE"];
        const MOUNTAIN_CHANCE = ctx["MOUNTAIN_CHANCE"];
        const ISLAND_CHANCE = ctx["ISLAND_CHANCE"];
        const ISLAND_DENSITY = ctx["ISLAND_DENSITY"];
        const PLATE_PERTURB_AMP = ctx["PLATE_PERTURB_AMP"];
        const PLATE_PERTURB_FREQ = Math.floor(ctx["PLATE_PERTURB_FREQ"]);
        const PLATE_PERTURB_OCT = ctx["PLATE_PERTURB_OCT"];
        // Mountain height
        const MT_HT = ctx["MT_HT"];
        const MT_HT_VAR = ctx["MT_HT_VAR"];
        // Plateau heights
        const PLATEAU_HT = ctx["PLATEAU_HT"];
        const PLATEAU_HT_VAR = ctx["PLATEAU_HT_VAR"];
        const HT_SMOOTH = ctx["HT_SMOOTH"];
        const HT_SMOOTH_TIMES = ctx["HT_SMOOTH_TIMES"];
        let t = new TimeKeeper();
        t.mark("");
        // let g = new AdjListII()
        // g.storeEdge(0, 1)
        // g.storeEdge(2, 3)
        // console.log(g.isEdge(0, 1))
        // console.log(g.isEdge(1, 0))
        // console.log(g.isEdge(0, 2))
        let sites = [];
        let randPlates = new RNG_1.RNG(PLATE_SEED);
        let rand = new RNG_1.RNG(randPlates.nextInt(1, 99999999));
        const abs = Math.abs, cos = Math.cos, pi = Math.PI;
        // SID_DEBUG code for square and hex
        // let gridy = Math.floor(Math.sqrt(NSITES/SIMW))
        // let gridx = Math.floor(gridy * SIMW)
        // let gg = 1 / (gridy)
        // NSITES = gridx * gridy
        // cc("~~", gridx, gridy, gg, NSITES)
        // MSite.xarr = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT))
        // MSite.yarr = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT))
        for (let i = 0; i < NSITES; i++) {
            sites[i] = new MSite();
            // sites[i].id = i
            sites[i].x = rand.nextDouble() * SIMW;
            if (!POLE_LESS_POINTS)
                sites[i].y = rand.nextDouble();
            else {
                // less points at poles
                // pick a point, pick its chance (cosine curve)
                var y;
                while (true) {
                    y = rand.nextDouble();
                    let chance = cos((2 * y - 1) * pi * .5 * 1.2); // last numebr is adjustment
                    if (rand.chance(chance))
                        break;
                }
                sites[i].y = y;
            }
            // SID_DEBUG Code for square and hex
            // let xx = i % gridx
            // let yy = Math.floor(i/gridx)
            // sites[i].x = xx * gg +(yy%2)*gg/2 +gg/2//+ yy*.001
            // sites[i].y = yy * gg + gg/2
            // // cc ("      ", xx, yy, sites[i].x, sites[i].y)
        }
        t.mark("Created sites");
        var bbox = { xl: 0, xr: SIMW, yt: 0, yb: 1 };
        var voronoi = new rhill_voronoi_core_1.Voronoi();
        // pass an object which exhibits xl, xr, yt, yb properties. The bounding
        // box will be used to connect unbound edges, and to close open cells
        let result = voronoi.compute(sites, bbox);
        for (let count = 0; count < LLOYD_COUNT; count++) {
            // Lloys relaxation
            for (let c of result.cells) {
                // Move Site center to centroid instead of Voronoi seeds
                let sx = 0, sy = 0;
                for (let h of c.halfedges) {
                    let v = h.getStartpoint();
                    sx += v.x;
                    sy += v.y;
                }
                c.site.x = sx / c.halfedges.length;
                c.site.y = sy / c.halfedges.length;
            }
            // TODO SID_DEBUG wrap around map
            // Create fake Sites
            {
                // let sites1 = sites.slice(0)
                result = voronoi.compute(sites, bbox);
            }
        }
        t.mark("Voronoi done");
        // TODO: just assign ids = index
        // NOTE: VV Imp that index === id
        sites.sort((a, b) => a.voronoiId - b.voronoiId); // Sort by voronoiId
        let siteAdj = new AdjListII();
        for (let e of result.edges) {
            if (e.lSite && e.rSite)
                siteAdj.storeEdge(e.lSite.voronoiId, e.rSite.voronoiId);
            if (e.lSite && !e.rSite)
                e.lSite.isMapEdge = true;
            if (e.rSite && !e.lSite)
                e.rSite.isMapEdge = true;
        }
        t.mark("Site graph");
        let vorVertSet = [];
        let m = new Map();
        let vorGAdj = new AdjListII();
        function findInVertSet(v) {
            var vv;
            vv = m.get(v);
            // TODO SID_DEBUG Wrap around
            // When working for wrapped around maps, vertices of voronoi polygons 
            // with x < 0 or x > 1 need to be mapped to correct vertices. Only way to do that
            // is to search for the vertex by comparing x and y, whcih may be very slow.
            // Even though only out of bounds vertices need to be mapped.
            // Using a array just for x and y of vertices may help, as it will be stored as 
            // a plain array 
            if (vv)
                return vv;
            // NOTE IMPORTANT SID_DEBUG *****************************
            // This below block takes 250 ms for
            // 500 verts, which is HUGE. All it does is
            // make vertices on the bounding box unique.
            // If we dont care about those, keep this commented.
            // for (vv of vorVertSet)
            // {
            //     if (vv.isEq(v))
            //     {
            //         return vv
            //     }
            // }
            vv = new VVert(v);
            vv.id = vorVertSet.length; // Id must be equal to index
            vorVertSet.push(vv);
            m.set(v, vv);
            return vv;
        }
        for (let e of result.edges) {
            var v1 = findInVertSet(e.va);
            var v2 = findInVertSet(e.vb);
            if (e.lSite) {
                v1.sites.add(e.lSite.voronoiId);
                v2.sites.add(e.lSite.voronoiId);
            }
            if (e.rSite) {
                v1.sites.add(e.rSite.voronoiId);
                v2.sites.add(e.rSite.voronoiId);
            }
            vorGAdj.storeEdge(v1.id, v2.id);
        }
        t.mark("Site graph, voronoi graph");
        // Create the polygons
        for (let c of result.cells) {
            let x = [], y = [];
            // let v0 = c.halfedges[0].getStartpoint()
            // let v1 = c.halfedges[0].getEndpoint()
            // x.push(v0.x); x.push(v1.x);
            // y.push(v0.y); y.push(v1.y);
            for (let i = 0; i < c.halfedges.length; i++) {
                let v0 = c.halfedges[i].getStartpoint();
                // let v1 = c.halfedges[i].getEndpoint()
                // if (x[x.length-1] != v0.x) console.log("Error! "+x+" "+v0.x)
                let yy = v0.y;
                if (POLE_LESS_POINTS) {
                    // yy /= 1
                    yy = (2 * yy - 1);
                    // yy = Math.sign(yy) * Math.pow(abs(yy), .7)
                    yy = yy * (1 - .3 * yy * yy);
                    yy = (yy + 1) * .5;
                }
                x.push(v0.x);
                y.push(yy);
            }
            c.site.polyx = x;
            c.site.polyy = y;
            // Move Site center to centroid instead of Voronoi seeds
            let sx = 0, sy = 0;
            for (let i = 0; i < x.length; i++) {
                sx += x[i];
                sy += y[i];
            }
            c.site.x = sx / x.length;
            c.site.y = sy / x.length;
        }
        t.mark("Created site poly");
        // console.log(siteAdj)
        // 
        // console.log(result.vertices.length+" "+vorVertSet.length)
        // console.log(vorVertSet[0])
        // console.log(vorGAdj)
        // console.log(result)
        //console.log(sites)
        // Plates
        let plates = [];
        let num_land_plates = 0;
        for (let i = 0; i < NPLATES; i++) {
            let p = new Plate();
            p.x = randPlates.nextDouble() * SIMW;
            p.y = randPlates.nextDouble();
            p.id = i;
            p.type = randPlates.chance(LAND_PLATE_CHANCE) ? 1 : 0;
            if (p.type == 1)
                num_land_plates++;
            p.clr = mycolor_1.hsbToRGB(rand.nextDouble() * .4 - .2 + p.type * .6, .9, rand.range(.6, .7)).toHex(); //SID_DEBUG
            plates.push(p);
        }
        t.mark("Made plates");
        let randPlatesNoise = new RNG_1.RNG(randPlates.nextDouble()
            * 99999999);
        let w_perturb_x = new Perlin_1.TiledOctNoise(randPlatesNoise, PLATE_PERTURB_FREQ, PLATE_PERTURB_FREQ, PLATE_PERTURB_FREQ, PLATE_PERTURB_OCT);
        let w_perturb_y = new Perlin_1.TiledOctNoise(randPlatesNoise, PLATE_PERTURB_FREQ, PLATE_PERTURB_FREQ, PLATE_PERTURB_FREQ, PLATE_PERTURB_OCT);
        let pertx = [];
        let perty = [];
        t.mark("Start Assign site to plate");
        {
            for (let s of sites) {
                let sid = s.voronoiId;
                let min = Infinity;
                let min_i = -1;
                // Perturb points to make plate boundaries curvy
                let sx = s.x, sy = s.y;
                //Map 0 to 1, keep it square
                let dx1 = (w_perturb_x.noise(sx / SIMW, sy / SIMW) * 2 - 1) * PLATE_PERTURB_AMP;
                let dy1 = (w_perturb_y.noise(sx / SIMW, sy / SIMW) * 2 - 1) * PLATE_PERTURB_AMP;
                sx += dx1;
                sy += dy1;
                pertx[sid] = sx;
                perty[sid] = sy;
                for (let p of plates) {
                    // WRAP around distnace calc plate to sites
                    // let offx = 0
                    // NOTE!! SID_DEBUG Notes on wraparound:
                    // 1. Plate warp noise must be wrap around
                    // 2. Plateau noises must also be wrap around
                    for (let offx = -SIMW; offx <= SIMW; offx += SIMW) {
                        let dx = sx - p.x - offx;
                        let dy = sy - p.y;
                        // More inflence at poles
                        // DID NOT WORK
                        // let dy1 = Math.abs(dy - .5)
                        // dy1 = dy1 * 200 + dy1 * dy1 * 4 * 20
                        // dx *= (1 + dy1)
                        let dist = dx * dx + dy * dy;
                        if (dist < min) {
                            min = dist;
                            min_i = p.id;
                        }
                    }
                }
                s.plate = min_i;
                if (min_i == -1)
                    cc("Cannot find plate for site", s.voronoiId, min_i);
            }
        }
        t.mark("End assign site to plate");
        // Calculate plate adjacency
        let pAdj = new AdjListII();
        for (let vi1 = 0; vi1 < NSITES; vi1++) {
            if (!siteAdj.edges[vi1])
                continue;
            let varr = siteAdj.edges[vi1];
            for (let vi2 of varr) {
                let site1 = sites[vi1], site2 = sites[vi2];
                if (site1.plate != site2.plate) {
                    pAdj.storeEdge(site1.plate, site2.plate);
                    site1.plateDist[site2.plate] = 1;
                    site2.plateDist[site1.plate] = 1;
                }
            }
        }
        t.mark("Calculated plate adj");
        // Calculate distance of (non member) sites from neighbouring plates
        // upto distance 2
        for (let vi1 in siteAdj.edges) {
            let varr = siteAdj.edges[vi1];
            for (let vi2 of varr) {
                let site1 = sites[vi1], site2 = sites[vi2];
                for (let pi in site1.plateDist) {
                    if (site1.plateDist[pi] == 1) {
                        if (!site2.plateDist[pi])
                            site2.plateDist[pi] = site1.plateDist[pi] + 1;
                        else if (site2.plateDist[pi] > site1.plateDist[pi] + 1)
                            site2.plateDist[pi] = site1.plateDist[pi] + 1;
                        // else no need to update, shorter path exists
                    }
                }
                for (let pi in site2.plateDist) {
                    if (site2.plateDist[pi] == 1) {
                        if (!site1.plateDist[pi])
                            site1.plateDist[pi] = site2.plateDist[pi] + 1;
                        else if (site1.plateDist[pi] > site2.plateDist[pi] + 1)
                            site1.plateDist[pi] = site2.plateDist[pi] + 1;
                        // else no need to update, shorter path exists
                    }
                }
            }
        }
        t.mark("Site to plate dist 2 steps");
        let heights = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT));
        for (let i = 0; i < NSITES; i++)
            heights[i] = -1;
        {
            class PlateHt {
                constructor() {
                    this.max = Math.abs(randPlates.nextGaussian() + .1) * .25 * PLATEAU_HT;
                    if (this.max > PLATEAU_HT)
                        this.max = PLATEAU_HT;
                    // this.min = (randPlates.nextDouble() * .2 + randPlates.nextDouble() * .6) * this.max
                    this.min = ((1 - PLATEAU_HT_VAR) + randPlates.nextDouble() * PLATEAU_HT_VAR)
                        * this.max;
                    if (randPlates.chance(.5)) {
                        // Smooth plateau
                        this.nn = new Perlin_1.PNoise(randPlatesNoise, .05 + randPlatesNoise.nextDouble() * 5, .05 + randPlatesNoise.nextDouble() * 5, 2);
                    }
                    else {
                        // Folds plateau
                        this.nn = new Perlin_1.PNoise(randPlatesNoise, .05 + randPlatesNoise.nextDouble(), 50 * (1 + 2 * randPlatesNoise.nextDouble()), 2);
                    }
                    // cos + sin, -sin + cos
                    let angle = randPlatesNoise.nextDouble() * Math.PI;
                    this.acos = Math.cos(angle);
                    this.asin = Math.sin(angle);
                }
            }
            let plans = [];
            for (let i = 0; i < NPLATES; i++) {
                plans.push(new PlateHt());
            }
            for (let s of sites) {
                let id = s.voronoiId;
                if (plates[s.plate].type == 0)
                    continue;
                let plan = plans[s.plate];
                // if (heights[id] == 0) // If not declared plate fold mountain
                {
                    // 1. Use perturbed coords to avoid ugly straight lines
                    // 2. rotate the point
                    // 2. Apply noise to area, may lead to simple variation or 
                    //    striations/ graben hurst 
                    let xx = pertx[id] * plan.acos + perty[id] * plan.asin;
                    let yy = -pertx[id] * plan.asin + perty[id] * plan.acos;
                    let nval = plan.nn.noise(xx, yy);
                    // nval = clamp(nval, 0, 1)
                    heights[id] = nval * (plan.max - plan.min) + plan.min;
                }
                heights[id] = clamp(heights[id], 0, 1);
            }
        }
        t.mark("Done Height calculate");
        let mountains = new AdjMat();
        mountains.directional = true;
        let num_mountains = 0;
        for (let pi1 = 0; pi1 < NPLATES; pi1++)
            for (let pi2 = pi1 + 1; pi2 < NPLATES; pi2++) {
                let roll = randPlates.nextDouble(); // Eat the random number,
                // use it or not for consistency
                // IMPORTANT NOTE!!! This will prevent mountains moving around due to
                // small tweaks to the map.
                let ht = MT_HT * .2 + Math.abs(randPlates.nextGaussian()) * MT_HT * .3;
                if (pAdj.isEdge(pi1, pi2)) {
                    if (ht > 2 * MT_HT)
                        ht = 2 * MT_HT; // Capped to 1 after smooth
                    if (plates[pi1].type == 0 && plates[pi2].type == 0) {
                        if (roll <= ISLAND_CHANCE) {
                            mountains.storeEdge(pi1, pi2, ht);
                        }
                    }
                    else if (roll <= MOUNTAIN_CHANCE) {
                        num_mountains++;
                        if (plates[pi1].type == plates[pi2].type) {
                            mountains.storeEdge(pi1, pi2, ht);
                            // if (rand.chance(.3))
                            //     mountains.storeEdge(pi2, pi1)
                        }
                        else if (plates[pi1].type == 1) {
                            mountains.storeEdge(pi1, pi2, ht);
                        }
                        else if (plates[pi2].type == 1) {
                            mountains.storeEdge(pi2, pi1, ht);
                        }
                    }
                }
            }
        ;
        // let land_sites:MSite[] = []
        for (let s of sites) {
            let p = plates[s.plate];
            if (p.type == 0) {
                s.biome = Biome.SEA;
                heights[s.voronoiId] = -1;
            }
            else {
                s.biome = Biome.GRASS;
                // land_sites.push(s)
            }
            s.plateDist.forEach((dist, pi) => {
                if (mountains.isEdge(s.plate, pi)) {
                    if (s.biome == Biome.SEA) {
                        if (plates[pi].type == 0
                            && s.plateDist[pi] /*== 1*/ <= 2
                            && randPlates.chance(ISLAND_DENSITY)) {
                            s.biome = Biome.GRASS;
                            heights[s.voronoiId] = clamp(Math.abs(randPlates.nextGaussian()) * .1, 0, 1);
                        }
                    }
                    else {
                        if ((plates[pi].type == 1
                            && s.plateDist[pi] == 1) // Land land, dist 1
                            || (plates[pi].type == 0
                                && s.plateDist[pi] == 2) // sea land
                        ) {
                            s.biome = Biome.MOUNTAIN;
                            heights[s.voronoiId] += mountains.getWeight(s.plate, pi)
                                * ((1 - MT_HT_VAR) + randPlates.nextDouble() * MT_HT_VAR);
                            // heights[s.voronoiId] = clamp(heights[s.voronoiId], 0, 1)// cap after smoothing
                        }
                    }
                }
            });
        }
        t.mark("Done techtonic fold mountain");
        // Smooth heights
        for (let sct = 0; sct < HT_SMOOTH_TIMES; sct++) {
            let heights1 = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT));
            for (let i = 0; i < NSITES; i++) {
                if (heights[i] < 0) {
                    // NOTE: Water is counted as 0 so it will never bring down
                    // land height to negative.
                    heights1[i] = -1;
                    continue;
                }
                let nbrs = siteAdj.edges[i];
                let n_nbrs = 0;
                let sumHNbrs = 0;
                for (let nbr of nbrs) {
                    n_nbrs++;
                    if (heights[nbr] >= 0) {
                        sumHNbrs += heights[nbr];
                    }
                    // else water counts as 0
                }
                // Note: Water contributes 0, so land next to water is a bit shorter
                let avgHNbrs = sumHNbrs / n_nbrs;
                let ht = heights[i] * (1 - HT_SMOOTH) + avgHNbrs * HT_SMOOTH;
                heights1[i] = ht;
            }
            heights = heights1;
        }
        for (let i = 0; i < NSITES; i++) {
            if (heights[i] != -1)
                heights[i] = clamp(heights[i], 0, 1);
        }
        // Note: Remember -1 for water
        t.mark("Done Height smoothing");
        // Distnace of site from sea
        let seadist = new Uint16Array(new ArrayBuffer(NSITES * Uint16Array.BYTES_PER_ELEMENT));
        {
            for (let i = 0; i < NSITES; i++)
                seadist[i] = 0;
            let q = new Queue(NSITES * 2);
            // 1. Insert each site next to sea into q. Assign dist = 1
            // 2. For each site in q, go to nbr. If seadist[nbr] = 0 (unassigned) and land
            //    That neighbour has not been handled yet
            //    set seadist = seadist[this]+1, insert nbr in q
            // Each nbr can go only once in q, when seadist (was) 0
            for (let s of sites) {
                if (heights[s.voronoiId] >= 0) {
                    for (let nbr of siteAdj.edges[s.voronoiId]) {
                        if (heights[nbr] == -1) {
                            seadist[s.voronoiId] = 1;
                            q.enqueue(s.voronoiId);
                            break;
                        }
                    }
                }
            }
            var sid;
            while ((sid = q.dequeue()) != null) {
                let thisdist = seadist[sid];
                for (let nbr of siteAdj.edges[sid]) {
                    if (heights[nbr] >= 0 // land
                        && seadist[nbr] == 0) {
                        seadist[nbr] = thisdist + 1;
                        q.enqueue(nbr);
                    }
                }
            }
        }
        t.mark("Done calculate distance from sea");
        let is_river = [];
        function bfs(start) {
            //!!!!!!!!!!!!!!!!!!!! NOTE SID_DEBUG 
            // THERE IS A BUG HERE
            // Some rivers dont take the shortest route
            let q = new Queue(vorVertSet.length);
            q.enqueue(start);
            let parents = []; // NOTE: Sparse
            parents[start] = -1;
            // For DEBUG
            // let dist:number[] = []// NOTE: Sparse
            // dist[start] = 0
            // cc("-------------")
            var id;
            // let count = 1000
            while ((id = q.dequeue()) != null) {
                // cc("==", id, dist[id], "nbr", vorGAdj.edges[id])
                // finish condition
                if (id != start) {
                    let v = vorVertSet[id];
                    // if (v.y < .1 || v.y > .9)// Dont enter polar regions
                    // {
                    //     continue;
                    // }
                    let sea = false;
                    // if (is_river[id])// TODO: restore after height based
                    //     sea = true;
                    // else
                    {
                        for (let sid of v.sites.arr) {
                            if (heights[sid] == -1) {
                                sea = true;
                                break;
                            }
                        }
                    }
                    if (sea) {
                        // cc ("== success")
                        let ret = [];
                        let vid = id;
                        while ((id || id == 0) && id != -1) {
                            ret.push(id);
                            is_river[id] = true;
                            id = parents[id];
                        }
                        return ret;
                    }
                }
                for (let nbr of vorGAdj.edges[id]) {
                    if (parents[nbr] === undefined) {
                        q.enqueue(nbr);
                        parents[nbr] = id;
                        // dist[nbr] = dist[id] + 1
                    }
                }
            }
            return null;
        }
        // Rivers
        class River {
            constructor() {
                this.vid = [];
            }
        }
        let rivers = [];
        for (let i = 0; i < 1000; i++) {
            let v = randPlatesNoise.pick(vorVertSet);
            if (v.y < .1 || v.y > .9)
                // Polar, probably
                continue;
            let land = true;
            for (let si of v.sites.arr) {
                if (heights[si] == -1) {
                    land = false;
                    break;
                }
            }
            if (!land)
                continue;
            // cc("Water ", v)
            let r = new River();
            // r.vid.push(v.id)
            // rivers.push(r)
            r.vid = bfs(v.id);
            if (r.vid) {
                rivers.push(r);
            }
        }
        t.mark("Done Rivers: " + rivers.length);
        // Start drawing SVG
        SVG_1.SVGReset();
        let H = 600; //SID_DEBUG
        let r = new SVG_1.SVGRoot(H * SIMW, H);
        // Note: Disable SVG anti aliasing. This makes the seams
        // between polygons disappear, makes rendering faster.
        // r.attrExtra = "shape-rendering=\"optimizeSpeed\""
        // Provide a background so that at least the water looks continuous
        // let back = new Rect(0, 0, W*SIMW, H)
        // back.nm="back"
        // back.fill="blue"
        // r.add(back)
        let floor = Math.floor;
        for (let s of sites) {
            // if (s.isMapEdge) continue
            let p = new SVG_1.CPoly();
            for (let i = 0; i < s.polyx.length; i++) {
                p.add(floor(s.polyx[i] * H * 1000) / 1000, floor(s.polyy[i] * H * 1000) / 1000);
            }
            // let t = temperatures[s.voronoiId]
            let h = heights[s.voronoiId];
            p.fill = heightColor(h);
            // p.fill = plates[s.plate].clr//SID_DEBUG
            // p.strokeWidth = 1
            // p.strokeColor = "#000"
            // if (plates[s.plate])
            // {
            //     // p.fill = plates[s.platehsbToRGB(rand.nextDouble(), .9, rand.range(.6, .7)).toHex();
            //     let type = plates[s.plate].type
            //     for (let pi of s.plateDist)
            //     {
            //         if ((type == 1 && pi <= 2) || (type == 0 && pi <= 1))
            //         {
            //             p.opacity = .5
            //             break
            //         }
            //     }
            //     // if (s.plateDist.length > 0)
            //     //     p.opacity = .5
            // }
            p.nm = "site_" + s.voronoiId;
            r.add(p);
            // r.add(new SVGText(""+s.voronoiId, s.x*W, s.y*H))
        }
        // Rivers SVG
        let rg = new SVG_1.SVGGroup();
        rg.nm = "rivers";
        r.add(rg);
        // console.log(rivers)
        for (let rvr of rivers) {
            let poly = new SVG_1.CPoly();
            poly.strokeColor = "blue";
            poly.strokeWidth = 1;
            poly.fill = "none";
            poly.closed = false;
            rg.add(poly);
            for (let vid of rvr.vid) {
                let v = vorVertSet[vid];
                let x = v.x * H;
                let y = v.y * H;
                poly.add(x, y);
            }
        }
        // Count land vs sea
        {
            let land = 0, sea = 0;
            let ht_histo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ht_max = 0;
            for (let s of sites) {
                if (s.biome == Biome.SEA)
                    sea++;
                else
                    land++;
                let h = heights[s.voronoiId];
                if (h > 0) {
                    let idx = Math.floor(h * 10);
                    if (ht_histo[idx] === undefined)
                        ht_histo[idx] = 0;
                    else
                        ht_histo[idx]++;
                    if (h > ht_max)
                        ht_max = h;
                }
            }
            console.log("Land " + (land / (land + sea) * 100) + " %");
            console.log("Max height: " + ht_max);
            console.log("Ht histo: " + ht_histo);
        }
        console.log("Num land plates: " + num_land_plates);
        // console.log("Num Mountains: "+num_mountains)
        t.mark("All done");
        let outline = new SVG_1.SVGGroup();
        outline.nm = "outline";
        r.add(outline);
        addToDoc(r);
        window["sites"] = sites;
        window["plates"] = plates;
        // window["temp"] = temperatures;SID_DEBUG
        window["height"] = heights;
        window["seadist"] = seadist;
        // Sites light up when clicked.
        for (let s of sites) {
            let e = document.getElementById("site_" + s.voronoiId);
            if (e) {
                e.onclick = siteClicked;
            }
        }
        let allScale = 1, allDx = 0, allDy = 0;
        let allMD = false, allDidMove = false;
        let allDragX = -1, allDragY = -1;
        const INC = .1;
        {
            // Allow drag and zoom
            let e = document.getElementById("SHP0");
            if (e) {
                e.onwheel = function (event) {
                    let sgn = Math.sign(event.wheelDelta);
                    allScale += INC * sgn;
                    allScale = clamp(allScale, .5, 32);
                    allDx -= INC * event.offsetX * sgn;
                    allDy -= INC * event.offsetY * sgn;
                    if (allDx > 0)
                        allDx = 0;
                    if (allDy > 0)
                        allDy = 0;
                    e.setAttribute("transform", "translate(" + allDx + "," + allDy + ") " +
                        "scale(" + allScale + ")");
                    // console.log(event)
                    return false;
                };
                e.onmousedown = function (event) {
                    if (event.buttons == 1) {
                        allDragX = event.offsetX;
                        allDragY = event.offsetY;
                        allMD = true;
                        allDidMove = false;
                    }
                    // console.log(event)
                };
                e.onmouseup = function (event) {
                    if (event.buttons == 1) {
                        allMD = false;
                        allDragX = -1;
                        allDragY = -1;
                        if (allDidMove)
                            return false; // Dont create click event
                    }
                    // console.log(event)
                };
                e.onmousemove = function (event) {
                    if (event.buttons == 1) {
                        allDidMove = true;
                        let dx = event.offsetX - allDragX;
                        let dy = event.offsetY - allDragY;
                        allDragX = event.offsetX;
                        allDragY = event.offsetY;
                        allDx += dx;
                        allDy += dy;
                        if (allDx > 0)
                            allDx = 0;
                        if (allDy > 0)
                            allDy = 0;
                        e.setAttribute("transform", "translate(" + allDx + "," + allDy + ") " +
                            "scale(" + allScale + ")");
                    }
                    // console.log(event.buttons)
                };
            }
        }
    };
    class Biome2 {
        constructor(name, minT, maxT, minP, maxP, color) {
            this.name = name;
            this.minT = minT;
            this.maxT = maxT;
            this.minP = minP;
            this.maxP = maxP;
            this.color = color;
            this.id = Biome2._id++;
        }
        apply(t, p) {
            if (t >= this.minT && t <= this.maxT
                && p >= this.minP && p <= this.maxP)
                return true;
            return false;
        }
    }
    Biome2._id = 0;
    let POLAR = new Biome2("Polar", -100, 0, -100, 100, "#eee"), TUNDRA = new Biome2("Tundra", 0, .1, -100, 100, "#88f"), COLD_DESERT = new Biome2("Cold desert", .1, .7, 0, .2, mycolor_1.hsbToRGB(.08, .8, .4).toHex()), BOREAL = new Biome2("Boreal", .1, .3, .2, 1, mycolor_1.hsbToRGB(.4, .6, .2).toHex()), TEMPERATE = new Biome2("Temperate seasonal", .3, .7, .2, .6, mycolor_1.hsbToRGB(.5, .7, .4).toHex()), //TBD COLOR!
    T_RAINFOREST = new Biome2("Temperate rainforest", .3, .7, .6, 1, mycolor_1.hsbToRGB(.45, .9, .6).toHex()), //TBD COLOR!
    HOT_DESERT = new Biome2("Hot desert", .7, 2, 0, .3, "#dd0"), SAVANNA = new Biome2("Savanna", .7, 2, .3, .6, mycolor_1.hsbToRGB(.28, .6, .5).toHex()), RAINFOREST = new Biome2("Tropical rainforst", .7, 2, .6, 2, mycolor_1.hsbToRGB(.33, .9, .3).toHex()), SEA = new Biome2("Sea", -1, -1, -1, -1, "blue");
    const ALL_BIOME = [POLAR, TUNDRA, COLD_DESERT, BOREAL, TEMPERATE, T_RAINFOREST,
        HOT_DESERT, SAVANNA, RAINFOREST,];
    let generateClimate = window["generateClimate"] = function (ctx) {
        let sites = window["sites"];
        let NSITES = sites.length;
        let heights = window["height"];
        const SEED = strToNum(ctx["CLIMATE_SEED"]);
        const CLIM_SIM = ctx["CLIM_SIM"] == "CLIM_SIM_SIM";
        const RAND_T_METHOD = ctx["RAND_T_METHOD"];
        const P_ADJUST = parseFloat(ctx["P_ADJUST"]);
        const T_ADJUST = parseFloat(ctx["T_ADJUST"]);
        const T_MAX = 1;
        const T_LAND_HOTTER = CLIM_SIM ? .1 : 0;
        // Ocean circulation will change it further
        // No effect in random climate as sea temp is useless
        const T_HT_FACTOR = ctx["T_HT_FACTOR"] - 0;
        const T_LAT_ADJ = ctx["T_LAT_ADJ"] - 0;
        const T_RAND_FREQ = Math.floor(ctx["T_RAND_FREQ"] - 0);
        const T_RAND_OCT = ctx["T_RAND_OCT"] - 0;
        const P_RAND_FREQ = Math.floor(ctx["P_RAND_FREQ"] - 0);
        const P_RAND_OCT = ctx["P_RAND_OCT"] - 0;
        const pi = Math.PI;
        let tk = new TimeKeeper();
        tk.mark("Start Climate generation");
        // let temperatures:number[] = []
        let temperatures = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT));
        if (RAND_T_METHOD == "RAND_T_LAT") {
            for (let i = 0; i < NSITES; i++) {
                let s = sites[i];
                let lat = (s.y - .5) * 2;
                let t = (Math.cos(lat * pi * T_LAT_ADJ) + 1) / 2 * T_MAX;
                t = (t - .1) * 1.1;
                if (s.biome != Biome.SEA) {
                    // t *= (1+T_LAND_HOTTER)
                    t -= T_HT_FACTOR * heights[s.voronoiId];
                }
                else {
                    t *= (1 - T_LAND_HOTTER);
                }
                temperatures[i] = t + T_ADJUST;
            }
        }
        else {
            let tn = new Perlin_1.TiledOctNoise(new RNG_1.RNG(SEED * 2), T_RAND_FREQ, T_RAND_FREQ, T_RAND_FREQ, T_RAND_OCT);
            for (let i = 0; i < NSITES; i++) {
                let s = sites[i];
                let t = tn.noise(s.x, s.y);
                if (s.biome != Biome.SEA) {
                    // t *= (1+T_LAND_HOTTER)
                    t -= T_HT_FACTOR * heights[s.voronoiId];
                }
                t = clamp(t * 2 - .3, -.2, 1);
                temperatures[i] = t + T_ADJUST;
            }
        }
        window["temp"] = temperatures;
        tk.mark("Done temperatures");
        let pn = new Perlin_1.TiledOctNoise(new RNG_1.RNG(SEED), P_RAND_FREQ, P_RAND_FREQ, P_RAND_FREQ, P_RAND_OCT);
        // let precip:number[] = []
        let precip = new Float32Array(new ArrayBuffer(NSITES * Float32Array.BYTES_PER_ELEMENT));
        for (let i = 0; i < NSITES; i++) {
            let s = sites[i];
            let p = pn.noise(s.x, s.y);
            //SID_DEBUG
            // let x = s.x;//(s.x+.7)%1.5
            // let p = (pn.noise(x, s.y) + pn.noise(1.5-x, s.y))/2
            p = clamp(p * 2 - .6, 0, 1);
            precip[i] = p + P_ADJUST;
        }
        window["precip"] = precip;
        tk.mark("Done Precipitation");
        let biome = [];
        for (let i = 0; i < NSITES; i++) {
            let s = sites[i];
            let t = temperatures[i];
            let p = precip[i];
            if (t > 0 && heights[i] == -1) {
                biome[i] = SEA;
                continue;
            }
            let b_find = null;
            for (let b of ALL_BIOME) {
                if (b.apply(t, p)) {
                    b_find = b;
                    break;
                }
            }
            biome[i] = b_find;
        }
        window["biome"] = biome;
        tk.mark("Biome");
    };
    function siteClicked(event) {
        let outline = document.getElementById("outline");
        while (outline.firstChild) {
            outline.removeChild(outline.firstChild);
        }
        let path = event.target;
        if (path.id == "cloned") {
            return;
        }
        let path1 = path.cloneNode();
        outline.appendChild(path1);
        let path1a = path1;
        path1a.id = "cloned";
        path1a.style.stroke = "red";
        path1a.style.strokeWidth = "1";
        // path1a.style.fill = "rgba(0, 0, 0, 0)"
        path1a.style.fill = "transparent";
        path1a.onclick = siteClicked;
        let id = parseInt(path.id.substring(5));
        console.log("Height", id, window["height"][id], "plate", window["sites"][id].plate, 
        // "seadist", window["seadist"][id])
        "biome", window["biome"][id].name);
    }
    function tempColor(t) {
        if (t > 0)
            return mycolor_1.hsbToRGB(0, 1, t).toHex();
        else
            return mycolor_1.hsbToRGB(.7, 1, -t).toHex();
    }
    function heightColor(h) {
        h *= 2;
        if (h >= 0)
            return mycolor_1.hsbToRGB(0, 0, h * .8).toHex();
        else
            return "#01a";
    }
    function addToDoc(r) {
        let svgml = r.toSVG();
        // Show SVG
        document.getElementById("canvas").innerHTML = svgml;
        // console.log(svgml);
        console.log(svgml.length);
        // Show SVG on canvas
        //    drawOnCanvas(svgml);
        // setupSVGSave(svgml);
    }
    var f;
    //f(); SID_DEBUG
    // var intv = setInterval(f, 2000);
    var intv;
    window["plateColor"] = function () {
        let sites = window["sites"];
        let plates = window["plates"];
        for (let s of sites) {
            let e = document.getElementById("site_" + s.voronoiId);
            if (e) {
                let pl = plates[s.plate];
                e.style.fill = pl.clr;
            }
        }
    };
    window["biomeColor"] = function () {
        let biomes = window["biome"];
        let sites = window["sites"];
        if (!biomes || !sites) {
            console.log("Biome or sites not generated");
            return;
        }
        for (let i = 0; i < biomes.length; i++) {
            let s = sites[i];
            let b = biomes[i];
            let e = document.getElementById("site_" + s.voronoiId);
            if (e) {
                if (b != null) {
                    e.style.fill = b.color;
                    // e.style.stroke = b.color
                    // e.style.strokeWidth = "1"                
                }
                else
                    e.style.fill = "brightpurple";
            }
        }
        setupSVGSave(document.getElementById("canvas").innerHTML, 'biome');
    };
    window["tempColor"] = function (type) {
        let sites = window["sites"];
        let arr;
        if (type == "temp")
            arr = window["temp"];
        else if (type == "precip")
            arr = window["precip"];
        for (let s of sites) {
            let id = s.voronoiId;
            let e = document.getElementById("site_" + id);
            if (e) {
                e.style.fill = tempColor(arr[id]);
            }
        }
    };
    window["heightColor"] = function () {
        let sites = window["sites"];
        let ht = window["height"];
        for (let s of sites) {
            let id = s.voronoiId;
            let e = document.getElementById("site_" + id);
            if (e) {
                e.style.fill = heightColor(ht[id]);
            }
        }
        setupSVGSave(document.getElementById("canvas").innerHTML, 'height');
    };
});
