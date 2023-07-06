function new_byte(count) {
    return new Int8Array(count);
}

function new_short(count) {
    return new Int16Array(count);
}

function new_int(count) {
    return new Int32Array(count);
}

function new_float(count) {
    return new Float32Array(count);
}

function new_double(count) {
    return new Float64Array(count);
}

function new_float_n(args) {
    if (args.length == 1) {
        return new_float(args[0]);
    }
    var sz = args[0];
    args = args.slice(1);
    var A = [];
    for (var i = 0; i < sz; i++) {
        A.push(new_float_n(args));
    }
    return A;
}
function new_int_n(args) {
    if (args.length == 1) {
        return new_int(args[0]);
    }
    var sz = args[0];
    args = args.slice(1);
    var A = [];
    for (var i = 0; i < sz; i++) {
        A.push(new_int_n(args));
    }
    return A;
}

function new_short_n(args) {
    if (args.length == 1) {
        return new_short(args[0]);
    }
    var sz = args[0];
    args = args.slice(1);
    var A = [];
    for (var i = 0; i < sz; i++) {
        A.push(new_short_n(args));
    }
    return A;
}

function new_array_n(args) {
    if (args.length == 1) {
        return new Array(args[0]);
    }
    var sz = args[0];
    args = args.slice(1);
    var A = [];
    for (var i = 0; i < sz; i++) {
        A.push(new_array_n(args));
    }
    return A;
}


var Arrays = {};

Arrays.fill = function (a, fromIndex, toIndex, val) {
    if (arguments.length == 2) {
        for (var i = 0; i < a.length; i++) {
            a[i] = arguments[1];
        }
    } else {
        for (var i = fromIndex; i < toIndex; i++) {
            a[i] = val;
        }
    }
};

var System = {};

System.arraycopy = function (src, srcPos, dest, destPos, length) {
    var srcEnd = srcPos + length;
    while (srcPos < srcEnd)
        dest[destPos++] = src[srcPos++];
};

System.out = {};
System.out.println = function (message) {
    console.log(message);
}

System.out.printf = function () {
    console.log.apply(console, arguments);
}


var Util = {};
Util.SQRT2 = 1.41421356237309504880;
Util.FAST_LOG10 = function (x) {
    return Math.log10(x);
};

Util.FAST_LOG10_X = function (x, y) {
    return Math.log10(x) * y;
};

function ShortBlock(ordinal) {
    this.ordinal = ordinal;
}
/**
 * LAME may use them, even different block types for L/R.
 */
ShortBlock.short_block_allowed = new ShortBlock(0);
/**
 * LAME may use them, but always same block types in L/R.
 */
ShortBlock.short_block_coupled = new ShortBlock(1);
/**
 * LAME will not use short blocks, long blocks only.
 */
ShortBlock.short_block_dispensed = new ShortBlock(2);
/**
 * LAME will not use long blocks, short blocks only.
 */
ShortBlock.short_block_forced = new ShortBlock(3);

var Float = {};
Float.MAX_VALUE = 3.4028235e+38;

function VbrMode(ordinal) {
    this.ordinal = ordinal;
}
VbrMode.vbr_off = new VbrMode(0);
VbrMode.vbr_mt = new VbrMode(1);
VbrMode.vbr_rh = new VbrMode(2);
VbrMode.vbr_abr = new VbrMode(3);
VbrMode.vbr_mtrh = new VbrMode(4);
VbrMode.vbr_default = VbrMode.vbr_mtrh;

var assert = function (x) {
    //console.assert(x);
};

module.exports = {
    "System": System,
    "VbrMode": VbrMode,
    "Float": Float,
    "ShortBlock": ShortBlock,
    "Util": Util,
    "Arrays": Arrays,
    "new_array_n": new_array_n,
    "new_byte": new_byte,
    "new_double": new_double,
    "new_float": new_float,
    "new_float_n": new_float_n,
    "new_int": new_int,
    "new_int_n": new_int_n,
    "new_short": new_short,
    "new_short_n": new_short_n,
    "assert": assert
};
