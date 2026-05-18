<<<<<<< HEAD
<%@ Language="JScript" %>
<%
/* ============================================================
   CPD Business Directory - Audit Log API
   Classic ASP (JScript) endpoint for IIS on Windows Server 2012

   GET  /api/audit.asp  - Returns audit_log.json contents
                          SUPERVISOR ONLY — 403 Forbidden for all others.

   POST /api/audit.asp  - Saves posted audit log array to audit_log.json
                          All authenticated users (used by every page to
                          write login, page_view, edit, logoff events).

   Access control uses the same WinNT ADSI group check as user.asp.
   ============================================================ */

// ---- Configuration ----
var SUPERVISOR_GROUP = "CPD-Supervisors";

// ---- Common headers ----
Response.ContentType = "application/json";
Response.CharSet = "utf-8";
Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");

var DATA_DIR   = Server.MapPath("../data");
var AUDIT_FILE = DATA_DIR + "\\audit_log.json";
var fso = Server.CreateObject("Scripting.FileSystemObject");

var method = String(Request.ServerVariables("REQUEST_METHOD") || "");

// ---- GET: supervisor-only read ----
if (method == "GET") {

  // Identify the caller and check group membership.
  var identity = String(Request.ServerVariables("LOGON_USER") || "") ||
                 String(Request.ServerVariables("AUTH_USER")   || "");

  if (!identity) {
    Response.Status = "401 Unauthorized";
    Response.Write('{"ok":false,"error":"Not authenticated"}');
    Response.End();
  }

  var domain = ""; var username = identity;
  var slash = identity.indexOf("\\");
  if (slash !== -1) { domain = identity.substring(0, slash); username = identity.substring(slash + 1); }

  if (!checkGroupMembership(domain, username, SUPERVISOR_GROUP)) {
    Response.Status = "403 Forbidden";
    Response.Write('{"ok":false,"error":"Access denied. Audit log is restricted to supervisors."}');
    Response.End();
  }

  // Authorized — return the log.
  if (fso.FileExists(AUDIT_FILE)) {
    var ts = fso.OpenTextFile(AUDIT_FILE, 1, false, -1);
    var content = ts.ReadAll();
    ts.Close();
    Response.Write('{"ok":true,"log":' + content + '}');
  } else {
    Response.Write('{"ok":true,"log":[]}');
  }
  Response.End();
}

// ---- POST: all authenticated users may write audit entries ----
if (method == "POST") {
  try {
    var bytes = Request.BinaryRead(Request.TotalBytes);
    var rawBody = "";
    var rs = Server.CreateObject("ADODB.Stream");
    rs.Type = 1;
    rs.Open();
    rs.Write(bytes);
    rs.Position = 0;
    rs.Type = 2;
    rs.CharSet = "utf-8";
    rawBody = rs.ReadText();
    rs.Close();

    var parsed;
    try {
      parsed = eval("(" + rawBody + ")");
    } catch(pe) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Invalid JSON"}');
      Response.End();
    }

    if (!parsed || !parsed.log || !(parsed.log instanceof Array)) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Expected { log: [...] }"}');
      Response.End();
    }

    // Cap at 2000 entries
    var log = parsed.log;
    if (log.length > 2000) log = log.slice(0, 2000);

    // Write audit_log.json
    var jsonStr = formatAuditJSON(log);
    var ws = Server.CreateObject("ADODB.Stream");
    ws.Type = 2;
    ws.CharSet = "utf-8";
    ws.Open();
    ws.WriteText(jsonStr);
    ws.SaveToFile(AUDIT_FILE, 2);
    ws.Close();

    Response.Write('{"ok":true,"saved":' + log.length + '}');

  } catch(e) {
    Response.Status = "500 Internal Server Error";
    Response.Write('{"ok":false,"error":"Server error: ' + String(e.message).replace(/"/g, '\\"') + '"}');
  }
  Response.End();
}

// ---- Helpers ----

function checkGroupMembership(domain, username, groupName) {
  /* Direct member check via WinNT ADSI provider.
     Returns false on any error (fail safe = no escalation). */
  try {
    var oGroup = GetObject("WinNT://" + domain + "/" + groupName + ",group");
    var members = new Enumerator(oGroup.Members());
    var userLC = username.toLowerCase();
    for (; !members.atEnd(); members.moveNext()) {
      if (String(members.item().Name).toLowerCase() === userLC) { return true; }
    }
  } catch(e) {}
  return false;
}

function formatAuditJSON(arr) {
  var parts = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var kvs = [];
    for (var k in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(k)) {
        var v = obj[k];
        if (v === null || typeof v === "undefined") {
          kvs.push('"' + escKey(k) + '":""');
        } else {
          kvs.push('"' + escKey(k) + '":"' + escVal(String(v)) + '"');
        }
      }
    }
    parts.push("  {" + kvs.join(", ") + "}");
  }
  return "[\n" + parts.join(",\n") + "\n]";
}

function escKey(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
function escVal(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
%>
=======
<%@ Language="JScript" %>
<%
/* ============================================================
   CPD Business Directory - Audit Log API
   Classic ASP (JScript) endpoint for IIS on Windows Server 2012

   GET  /api/audit.asp  - Returns audit_log.json contents
                          SUPERVISOR ONLY — 403 Forbidden for all others.

   POST /api/audit.asp  - Saves posted audit log array to audit_log.json
                          All authenticated users (used by every page to
                          write login, page_view, edit, logoff events).

   Access control uses the same WinNT ADSI group check as user.asp.
   ============================================================ */

// ---- Configuration ----
var SUPERVISOR_GROUP = "CPD-Supervisors";

// ---- Common headers ----
Response.ContentType = "application/json";
Response.CharSet = "utf-8";
Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");

var DATA_DIR   = Server.MapPath("../data");
var AUDIT_FILE = DATA_DIR + "\\audit_log.json";
var fso = Server.CreateObject("Scripting.FileSystemObject");

var method = String(Request.ServerVariables("REQUEST_METHOD") || "");

// ---- GET: supervisor-only read ----
if (method == "GET") {

  // Identify the caller and check group membership.
  var identity = String(Request.ServerVariables("LOGON_USER") || "") ||
                 String(Request.ServerVariables("AUTH_USER")   || "");

  if (!identity) {
    Response.Status = "401 Unauthorized";
    Response.Write('{"ok":false,"error":"Not authenticated"}');
    Response.End();
  }

  var domain = ""; var username = identity;
  var slash = identity.indexOf("\\");
  if (slash !== -1) { domain = identity.substring(0, slash); username = identity.substring(slash + 1); }

  if (!checkGroupMembership(domain, username, SUPERVISOR_GROUP)) {
    Response.Status = "403 Forbidden";
    Response.Write('{"ok":false,"error":"Access denied. Audit log is restricted to supervisors."}');
    Response.End();
  }

  // Authorized — return the log.
  if (fso.FileExists(AUDIT_FILE)) {
    var ts = fso.OpenTextFile(AUDIT_FILE, 1, false, -1);
    var content = ts.ReadAll();
    ts.Close();
    Response.Write('{"ok":true,"log":' + content + '}');
  } else {
    Response.Write('{"ok":true,"log":[]}');
  }
  Response.End();
}

// ---- POST: all authenticated users may write audit entries ----
if (method == "POST") {
  try {
    var bytes = Request.BinaryRead(Request.TotalBytes);
    var rawBody = "";
    var rs = Server.CreateObject("ADODB.Stream");
    rs.Type = 1;
    rs.Open();
    rs.Write(bytes);
    rs.Position = 0;
    rs.Type = 2;
    rs.CharSet = "utf-8";
    rawBody = rs.ReadText();
    rs.Close();

    var parsed;
    try {
      parsed = eval("(" + rawBody + ")");
    } catch(pe) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Invalid JSON"}');
      Response.End();
    }

    if (!parsed || !parsed.log || !(parsed.log instanceof Array)) {
      Response.Status = "400 Bad Request";
      Response.Write('{"ok":false,"error":"Expected { log: [...] }"}');
      Response.End();
    }

    // Cap at 2000 entries
    var log = parsed.log;
    if (log.length > 2000) log = log.slice(0, 2000);

    // Write audit_log.json
    var jsonStr = formatAuditJSON(log);
    var ws = Server.CreateObject("ADODB.Stream");
    ws.Type = 2;
    ws.CharSet = "utf-8";
    ws.Open();
    ws.WriteText(jsonStr);
    ws.SaveToFile(AUDIT_FILE, 2);
    ws.Close();

    Response.Write('{"ok":true,"saved":' + log.length + '}');

  } catch(e) {
    Response.Status = "500 Internal Server Error";
    Response.Write('{"ok":false,"error":"Server error: ' + String(e.message).replace(/"/g, '\\"') + '"}');
  }
  Response.End();
}

// ---- Helpers ----

function checkGroupMembership(domain, username, groupName) {
  /* Direct member check via WinNT ADSI provider.
     Returns false on any error (fail safe = no escalation). */
  try {
    var oGroup = GetObject("WinNT://" + domain + "/" + groupName + ",group");
    var members = new Enumerator(oGroup.Members());
    var userLC = username.toLowerCase();
    for (; !members.atEnd(); members.moveNext()) {
      if (String(members.item().Name).toLowerCase() === userLC) { return true; }
    }
  } catch(e) {}
  return false;
}

function formatAuditJSON(arr) {
  var parts = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var kvs = [];
    for (var k in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(k)) {
        var v = obj[k];
        if (v === null || typeof v === "undefined") {
          kvs.push('"' + escKey(k) + '":""');
        } else {
          kvs.push('"' + escKey(k) + '":"' + escVal(String(v)) + '"');
        }
      }
    }
    parts.push("  {" + kvs.join(", ") + "}");
  }
  return "[\n" + parts.join(",\n") + "\n]";
}

function escKey(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
function escVal(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
%>
>>>>>>> origin/main
