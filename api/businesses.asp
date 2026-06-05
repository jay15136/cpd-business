<%@ Language="JScript" %>
<%
/* ============================================================
   CPD Business Directory - Businesses API
   Classic ASP (JScript) endpoint for IIS on Windows Server 2012

   GET  /api/businesses.asp  - Returns businesses.json contents
   POST /api/businesses.asp  - Saves posted JSON array to businesses.json
                                Also regenerates businesses.js seed wrapper
   ============================================================ */

Response.ContentType = "application/json";
Response.CharSet = "utf-8";
Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");

var DATA_DIR  = Server.MapPath("../data");
var BIZ_FILE  = DATA_DIR + "\\businesses.json";
var BIZ_JS    = DATA_DIR + "\\businesses.js";
var BAK_FILE  = BIZ_FILE + ".bak";

var fso = Server.CreateObject("Scripting.FileSystemObject");

// ---- GET: return current businesses.json ----
if (Request.ServerVariables("REQUEST_METHOD") == "GET") {
  if (fso.FileExists(BIZ_FILE)) {
    var ts = fso.OpenTextFile(BIZ_FILE, 1, false, -1); // 1=read, -1=unicode
    var content = ts.ReadAll();
    ts.Close();
    Response.Write('{"ok":true,"businesses":' + content + '}');
  } else {
    Response.Write('{"ok":true,"businesses":[]}');
  }
  Response.End();
}

// ---- POST: save businesses array ----
if (Request.ServerVariables("REQUEST_METHOD") == "POST") {
  try {
    // Read the raw POST body
    var bytes = Request.BinaryRead(Request.TotalBytes);
    var rawBody = "";
    // Convert binary to string
    var rs = Server.CreateObject("ADODB.Stream");
    rs.Type = 1; // binary
    rs.Open();
    rs.Write(bytes);
    rs.Position = 0;
    rs.Type = 2; // text
    rs.CharSet = "utf-8";
    rawBody = rs.ReadText();
    rs.Close();

    // Parse to validate - expect { "businesses": [...] }
    // JScript eval for JSON parsing (Server 2012 Classic ASP has no JSON.parse)
    var parsed;
    try {
      parsed = eval("(" + rawBody + ")");
    } catch(pe) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Invalid JSON: ' + String(pe.message).replace(/"/g, '\\"') + '"}');
      Response.End();
    }

    if (!parsed || !parsed.businesses || !(parsed.businesses instanceof Array)) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Expected { businesses: [...] }"}');
      Response.End();
    }

    var bizArray = parsed.businesses;

    // Backup current file before overwrite
    if (fso.FileExists(BIZ_FILE)) {
      try { fso.CopyFile(BIZ_FILE, BAK_FILE, true); } catch(be) { /* ignore */ }
    }

    // Write businesses.json (pretty-printed)
    var jsonStr = formatJSON(bizArray);
    var ws = Server.CreateObject("ADODB.Stream");
    ws.Type = 2;
    ws.CharSet = "utf-8";
    ws.Open();
    ws.WriteText(jsonStr);
    ws.SaveToFile(BIZ_FILE, 2); // 2 = overwrite
    ws.Close();

    // Regenerate businesses.js wrapper (preserving PDF map)
    regenerateBizJS(bizArray);

    Response.Write('{"ok":true,"saved":' + bizArray.length + '}');

  } catch(e) {
    Response.Status = "500 Internal Server Error";
    Response.Write('{"ok":false,"error":"Server error: ' + String(e.message).replace(/"/g, '\\"') + '"}');
  }
  Response.End();
}

// ---- Helpers ----

function formatJSON(arr) {
  // Simple JSON array formatter for business records
  var parts = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var kvs = [];
    for (var k in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(k)) {
        var v = obj[k];
        if (v === null || typeof v === "undefined") {
          kvs.push('"' + escKey(k) + '":""');
        } else if (typeof v === "object") {
          // arrays (tags, etc.)
          kvs.push('"' + escKey(k) + '":' + simpleStringify(v));
        } else if (typeof v === "boolean") {
          kvs.push('"' + escKey(k) + '":' + (v ? "true" : "false"));
        } else if (typeof v === "number") {
          kvs.push('"' + escKey(k) + '":' + v);
        } else {
          kvs.push('"' + escKey(k) + '":"' + escVal(String(v)) + '"');
        }
      }
    }
    parts.push("  {\n    " + kvs.join(",\n    ") + "\n  }");
  }
  return "[\n" + parts.join(",\n") + "\n]";
}

function simpleStringify(obj) {
  if (obj instanceof Array) {
    var items = [];
    for (var i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "string") items.push('"' + escVal(obj[i]) + '"');
      else items.push(String(obj[i]));
    }
    return "[" + items.join(",") + "]";
  }
  return '""';
}

function escKey(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
function escVal(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

function regenerateBizJS(bizArray) {
  try {
    // Read existing businesses.js to preserve the PDF map section
    var pdfMapSection = "";
    if (fso.FileExists(BIZ_JS)) {
      var rjs = fso.OpenTextFile(BIZ_JS, 1, false, -1);
      var existing = rjs.ReadAll();
      rjs.Close();
      var idx = existing.indexOf("// PDF file map");
      if (idx === -1) idx = existing.indexOf("var CPD_PDF_MAP");
      if (idx !== -1) {
        pdfMapSection = "\n" + existing.substring(idx);
      }
    }

    var jsContent = "// Auto-generated seed data wrapper\nvar CPD_SEED_DATA = \n" +
      formatJSON(bizArray) + ";\n" + pdfMapSection;

    var wjs = Server.CreateObject("ADODB.Stream");
    wjs.Type = 2;
    wjs.CharSet = "utf-8";
    wjs.Open();
    wjs.WriteText(jsContent);
    wjs.SaveToFile(BIZ_JS, 2);
    wjs.Close();
  } catch(e) { /* non-critical */ }
}
%>
