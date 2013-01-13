(function() {
  "use strict";

  var booth_size = 50;
  var Raphael = window.Raphael; // dependency
  function randomChoice(arr) {
    var idx = parseInt(Math.random() * arr.length, 10);
    return arr[idx];
  }

  // Generates a fuzzy number close to N
  // Params:
  //   fuzzy(n, jitter)
  //   fuzzy(n, jitter_low, jitter_high);
  function fuzzy() {
    var args = Array.prototype.slice.call(arguments);
    var n = args.shift();

    var
      jitter_high = 1,
      jitter_low = 1;

    if (args.length) {
      jitter_high = args.shift();
      jitter_low = jitter_high;
    }

    if (args.length) {
      jitter_high = args.shift();
    }

    var range = Math.abs(jitter_high) + Math.abs(jitter_low);
    var jitter = Math.random() * range - jitter_low;

    var ret = Math.round(n + jitter);

    return ret;
  }

  function rounded(n, mod) {
    return Math.round(n / mod) * mod;
  }

  var booth_palette = [
    '#FC2600',
    '#0101A3',
    '#FCD838',
    '#DADADA'
  ];

  var palette = [
    '#FCD800',
    '#FC2600',
    '#0101A3'
  ];

  var boogie_palette = [
    '#FF2600',
    '#0101A3',
    '#FCD800',
    '#FCD810',
    '#FCD820',
    '#FCD838'
  ];

  function raise(rect) {
    // raise the rect to top of stack
    rect.node.parentNode.appendChild(rect.node);
  }

  function colorRectP(rect, gradient, palette) {
    var color_str = randomChoice(palette);
    var color = Raphael.color(color_str);

    if (gradient) {
      h_color = Raphael.hsl(color.h, color.s, color.l);
      color.l += 0.1;
      h_next_color = Raphael.hsl(color.h, color.s, color.l);

      rect.attr('gradient', '90-' + h_color + '-' + h_next_color +
        (Math.random() > 0.5 ? ':10' : ':70'));
    } else {
      rect.attr('fill', color_str);
    }

    raise(rect);
  }

  function colorRect(rect, gradient, boogie) {
    colorRectP(rect, gradient, boogie ? boogie_palette : palette);
  }

  var ids = 0;
  function newRectFactory(paper, rects, border) {
    function newRect(x, y, w, h) {
      var rect = paper.rect(x,y,w,h);
      if (!border) {
        rect.attr('stroke-width', '0px');
      } else {
        rect.attr('stroke-width', '3px');
      }

      rect.attr("stroke-color", "#1F1A18");
      rect.__id = ids++;


      rects.push(rect);
      return rect;
    }

    return newRect;
  }

  function getBox(r) {
      var x = r.attr('x');
      var y = r.attr('y');
      var w = r.attr('width');
      var h = r.attr('height');

      return [x, y, w, h];
  }

  function pickCuts(lower, upper, count) {
    var cuts = [];
    var range = upper - lower;

    for (var i = 0; i < count; i++) {
      cuts.push(Math.round(Math.random() * range + lower));
    }

    return cuts;
  }

  // cross cut this bad boy
  function crossCut(rect, cuts, horizontal, newRect) {
    var b = getBox(rect),x=b[0],y=b[1],w=b[2],h=b[3];
    var cross_cuts;
    if (!horizontal) {
      cross_cuts = pickCuts(x, x + w, cuts);
    } else {
      cross_cuts = pickCuts(y, y + h, cuts);
    }

    cross_cuts.sort(function(a, b) { return a - b });
    for (var i = 0; i < cuts; i++) {

      if (!horizontal) {
        newRect(cross_cuts[i], y, 20, h);
      } else {
        newRect(x, cross_cuts[i], w, 20);
      }

    }

  }

  function buildGrid(paper, splits, boogie) {
    var rects = [];
    var newRect = newRectFactory(paper, [], !boogie);
    var offset = 50;
    var rect = newRect(-offset, -offset, paper.width + offset, paper.height + offset);
    var rectPusher = function() {
      rects.push(Array.prototype.slice.call(arguments));
    }

    crossCut(rect, fuzzy(splits, 2), false, rectPusher);
    crossCut(rect, fuzzy(splits, 2), true, rectPusher);

    var x_axis = [];
    var y_axis = [];
    for (var i = 0; i < rects.length; i++) {
      var b = rects[i];
      var x=b[0],y=b[1],w=b[2],h=b[3];

      x_axis.push(x);
      x_axis.push(x + w);
      y_axis.push(y);
      y_axis.push(y + h);
    }

    x_axis.sort(function(a,b) { return a - b; });
    y_axis.sort(function(a,b) { return a - b; });

    rects.x_axis = x_axis;
    rects.y_axis = y_axis;

    return rects;

  }

  function buildGridRects(paper, grid, boogie) {
    var rects = [];

    var newRect = newRectFactory(paper, rects, !boogie);


    for (var i = 0; i < grid.length; i++) {
      newRect.apply(null, grid[i]);
    }

    return rects;
  }

  function buildSkeletonRects(paper, splits, boogie) {
    var rects = [];
    var newRect = newRectFactory(paper, rects, !boogie);


    var min_side_size = 40;
    var offset = 30;
    var rect = newRect(-offset, -offset,
      paper.width + offset, paper.height + offset);
    rect.attr('stroke-width', '0px');

    for (var i = 0; i < splits; i++) {
      var cur_rect = randomChoice(rects);

      var x = cur_rect.attr('x'),
          y = cur_rect.attr('y'),
          w = cur_rect.attr('width'),
          h = cur_rect.attr('height');

      var w_factor = parseInt(Math.log(Math.random() * w * w * w), 10);
      var h_factor = parseInt(Math.log(Math.random() * h * h * h), 10);

      new_w = parseInt(w / 2, 10); // default to splitting in half
      new_h = parseInt(h / 2, 10); // default to splitting in half

      // And then split the log of the square
      if (Math.random() > 0.5) {
        var new_w = parseInt(w / w_factor, 10);
      } else {
        var new_h = parseInt(h / h_factor, 10);
      }

      if (h - new_h < min_side_size || new_h < min_side_size) {
        continue;
      }

      if (w - new_w < min_side_size || new_w < min_side_size) {
        continue;
      }

      var new_rect = newRect(x + new_w, y + new_h, w - new_w, h - new_h);
      var old_rect = newRect(x, y, new_w, new_h);

      // Setup the rectangle hierarchy
      new_rect.parent = old_rect.parent = cur_rect;

      if (!cur_rect.children) {
        cur_rect.children = [];
        var parent = cur_rect.parent;
        while (parent) {
          if (!parent.children) { parent.children = true; };
          parent = parent.parent;
        }
      }

      cur_rect.children.push(new_rect);
      cur_rect.children.push(old_rect);
    }

    return rects;
  }

  function paintRects(rects) {
    var paintability = 0.2;
    var paintable_rects = rects.filter(function(r) {
      return !r.children;
    });

    for (var i = 0; i < paintable_rects.length; i++) {
      if (Math.random() < paintability) {
        var rect = paintable_rects[i];
        colorRect(rect);
      }
    }

    return rects;
  }

  function textureRects(rects) {

    for (var i = 0; i < rects.length; i++) {
      if (rects[i].children) {
        rects[i].blur();
      } else {
        rects[i].blur();
      }

    }
    return rects;
  }

  function explodeRect(r, piece_size, newRect, boogie) {
    var b = getBox(r),x=b[0],y=b[1],w=b[2],h=b[3];
    var w_pieces = parseInt(w / piece_size, 10);
    var h_pieces = parseInt(h / piece_size, 10);
    var w_piece_size = parseInt(w / w_pieces, 10);
    var h_piece_size = parseInt(h / h_pieces, 10);


    if (w_pieces >= 3 && h_pieces >= 3) {
      return;
    }

    if (w_pieces < 1 || h_pieces < 1) {
      return;
    }


    for (var i = 0; i < w_pieces; i++) {
      for (var j = 0; j < h_pieces; j++) {
        var rect = newRect(
          (i * w_piece_size) + x,
          (j * h_piece_size) + y,
          Math.min(w_piece_size, w - (i * w_piece_size)) + 1,
          Math.min(w_piece_size, h - (j * h_piece_size)) + 1);

        rect.explode = true;
        colorRect(rect, false, boogie);
        rect.attr('stroke-width', '0px');
      }
    }

    // Make it so that the exploded rect still has an outline by
    // putting the exploded rect above all its children
    raise(r);


  }

  function explodeRects(paper, rects) {
    var explodability = 0.1;
    var returned_rects = [];
    var newRect = newRectFactory(paper, returned_rects, false);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];

      var piece_size = parseInt(Math.random() * 10 + 20, 10);

      var b = getBox(r),x=b[0],y=b[1],w=b[2],h=b[3];

      if (Math.random() < explodability && !r.children) {
        explodeRect(r, piece_size, newRect);
      }


    }

    return returned_rects;
  }

  function openBooths(paper, grid, boardwalks) {
    var returned_rects = [];
    var newRect = newRectFactory(paper, returned_rects, false);


    // Draw another square inside this one
    function addBooth(x, y, w, h, up, booth_size) {
      var booth_width = w;
      var booth_height = h;
      var booth_offset_x = 10;
      var booth_offset_y = 10;

      if (w > paper.width / 2 || h > paper.width / 2) {
        return;
      }

      if (up) {
        booth_offset_x = parseInt(Math.random() * 4 + 2, 10) * w / 7;
        booth_width /= fuzzy(4, 2);
      } else {
        booth_offset_y = parseInt(Math.random() * 4 + 2, 10) * h / 7;
        booth_height /= fuzzy(4, 2);
      }

      if (booth_height < booth_size || booth_width < booth_size) {
        return;
      }

      var booth = newRect(
        rounded(x + booth_offset_x, 20),
        rounded(y + booth_offset_y, 20),
        rounded(booth_width, 40),
        rounded(booth_height, 40));

      function fillBooth(booth, both) {
        var b = getBox(booth),x=b[0],y=b[1],w=b[2],h=b[3];

        var bx = x;
        var by = y;
        var bw = w;
        var bh = h;

        if (up || both) {
          by += bh / 4;
          bh /= 2;
        }

        if (!up || both) {
          bx += bw / 4;
          bw /= 2;
        }

        var inner = newRect(
          bx,
          by,
          bw,
          bh);
        colorRectP(inner, null, booth_palette);

        return inner;
      }

      colorRectP(booth, null, booth_palette);

      var inner = fillBooth(booth);
      if (flip()) {
        fillBooth(inner, true);
      }

    }

    var x_axis = grid.x_axis;
    var y_axis = grid.y_axis;

    var boothiness = 0.3;
    for (var i = 0; i < x_axis.length - 1; i++) {
      var x = x_axis[i], w = x_axis[i+1] - x_axis[i];

      for (var j = 0; j < y_axis.length - 1; j++) {
        var y = y_axis[j], h = y_axis[j+1] - y_axis[j];
        if (Math.random() < boothiness) {
          addBooth(x, y, w, h, true, booth_size);
        }
      }
    }
  }

  function flip() {
    return sometimes() == - 1;
  }

  function sometimes(n) {
    n = n || 0.5;
    if (n > 1) {
      n = 1 / n;
    }
    return Math.random() < n ? 1 : -1;
  }

  function paveBoardwalks(paper, rects) {
    var pw = paper.width,
        ph = paper.height;

    rects.sort(function() { return Math.random() > 0.5; });
    var ret = [];
    var newRect = newRectFactory(paper, ret, false);

    function paveBoardwalk(boardwalk_size, x, y, w, h) {
      x = rounded(x, boardwalk_size * 2);
      y = rounded(y, boardwalk_size * 2);

      var r = newRect(x, y, w, h);
      explodeRect(r, boardwalk_size, newRect, true);
      r.remove();
    }

    var boardwalk_size = 20;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      var b = getBox(r),x=b[0],y=b[1],w=b[2],h=b[3];

      if (w > pw / 5) {
          paveBoardwalk(boardwalk_size, x, y, w, boardwalk_size);
          paveBoardwalk(boardwalk_size, x, y + h, w, boardwalk_size);
      }

      if (h > ph / 7) {
        paveBoardwalk(boardwalk_size, x, y, boardwalk_size, h);
        paveBoardwalk(boardwalk_size, x + w, y, boardwalk_size, h);
      }
    }

    return ret;
  }

  function installStoplights(paper, grid) {
    var x_axis = grid.x_axis, y_axis = grid.y_axis;
    var boardwalk_size = 20;

    for (var i = 0; i < x_axis.length - 1; i++) {
      var x = x_axis[i], w = x_axis[i+1] - x_axis[i];

      for (var j = 0; j < y_axis.length - 1; j++) {

        if (flip()) {
          continue;
        }

        var y = y_axis[j], h = y_axis[j+1] - y_axis[j];
        var circ = paper.rect(
          rounded(x, boardwalk_size * 2),
          rounded(y, boardwalk_size * 2),
          boardwalk_size + fuzzy(2, 1),
          boardwalk_size + fuzzy(2, 1));
        circ.attr('fill', '#DFDADA');
        circ.attr('stroke-width', '0px');
      }
    }
  }


  function doTheBoogie(rects) {
    var tile1 = randomChoice(rects);
    var tile2 = randomChoice(rects);

    var a = getBox(tile1),ax=a[0],ay=a[1],aw=a[2],ah=a[3];
    var b = getBox(tile2),bx=b[0],by=b[1],bw=b[2],bh=b[3];

    var duration = 5000;

    tile1.animate({ x: bx, width: bw}, duration, "linear", function() {
      tile1.animate({ y: by, height: bh}, duration, "linear");
    });

    tile2.animate({ x: ax, width: aw }, duration, "linear", function() {
      tile2.animate({ y: ay, height: ah}, duration, "linear");
    });

    raise(tile1);
    raise(tile2);

  };

  function main() {
    var w = screen.availWidth, h = screen.availHeight;

    var paper = Raphael(0, 0, w, h);
    var boogie = Math.random() > 0.5;
    var min_splits = boogie ? 3 : 5;
    var splits = Math.random() * min_splits + min_splits;


    if (boogie) {
      var grid = buildGrid(paper, splits, boogie);
      var skeleton_rects = buildGridRects(paper, grid, boogie);
      skeleton_rects.x_axis = grid.x_axis;
      skeleton_rects.y_axis = grid.y_axis;

      var booths = openBooths(paper, skeleton_rects, boardwalks);
      var boardwalks = paveBoardwalks(paper, skeleton_rects);

      setInterval(function() { doTheBoogie(boardwalks) }, 1000);

      var stoplights = installStoplights(paper, grid);

    } else {
      var skeleton_rects = buildSkeletonRects(paper, splits, boogie);
      var exploded_rects = explodeRects(paper, skeleton_rects);
      var painted_rects = paintRects(skeleton_rects);

    }
  }

  window.ReMondrian = {
    run: main
  }
})();
