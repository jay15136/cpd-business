<<<<<<< HEAD
<%@ Language="JScript" %>
<%
/* ============================================================
   CPD Business Directory - Windows Authentication User Endpoint
   Classic ASP (JScript) for IIS on Windows Server 2012

   GET /api/user.asp
   Returns the authenticated Windows username and whether the user
   is a member of the configured supervisor AD group.

   Requires IIS Windows Authentication to be enabled and Anonymous
   Authentication to be disabled (set in web.config).

   CONFIGURATION:
     SUPERVISOR_GROUP — Name of the AD security group whose members
                        are treated as supervisors. Must be a group
                        in the same domain. Direct members only;
                        nested group membership is not evaluated.
   ============================================================ */

// ---- Configuration ----
var SUPERVISOR_GROUP = "CPD-Supervisors";

// ---- Response headers ----
Response.ContentType = "application/json";
Response.CharSet = "utf-8";
Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");

// ---- Read IIS-provided identity ----
var authUser   = String(Request.ServerVariables("AUTH_USER")   || "");
var logonUser  = String(Request.ServerVariables("LOGON_USER")  || "");
var remoteAddr = String(Request.ServerVariables("REMOTE_ADDR") || "");

// Prefer LOGON_USER (set after Kerberos/NTLM handshake) over AUTH_USER
var identity = logonUser || authUser;

if (!identity) {
  Response.Status = "401 Unauthorized";
  Response.Write('{"ok":false,"error":"Not authenticated. Ensure IIS Windows Authentication is enabled and Anonymous Authentication is disabled."}');
  Response.End();
}

// ---- Parse DOMAIN\username ----
var domain   = "";
var username = identity;
var slash = identity.indexOf("\\");
if (slash !== -1) {
  domain   = identity.substring(0, slash);
  username = identity.substring(slash + 1);
}

// ---- Check supervisor group membership ----
var isSupervisor = false;
if (domain && username && SUPERVISOR_GROUP) {
  isSupervisor = checkGroupMembership(domain, username, SUPERVISOR_GROUP);
}

// ---- Return result ----
Response.Write(
  '{"ok":true' +
  ',"username":'       + '"' + escVal(username)      + '"' +
  ',"displayName":'    + '"' + escVal(identity)       + '"' +
  ',"domain":'         + '"' + escVal(domain)          + '"' +
  ',"isSupervisor":'   + (isSupervisor ? 'true' : 'false') +
  ',"ip":'             + '"' + escVal(remoteAddr)      + '"' +
  '}'
);

// ---- Helpers ----

function checkGroupMembership(domain, username, groupName) {
  /* Checks whether username is a direct member of groupName in the given
     domain using the WinNT ADSI provider. The application pool identity
     must have permission to enumerate group membership (any authenticated
     domain account can do this by default). */
  try {
    var oGroup = GetObject("WinNT://" + domain + "/" + groupName + ",group");
    var members = new Enumerator(oGroup.Members());
    var userLC = username.toLowerCase();
    for (; !members.atEnd(); members.moveNext()) {
      var member = members.item();
      if (String(member.Name).toLowerCase() === userLC) {
        return true;
      }
    }
  } catch(e) {
    // Group not found, permission denied, or WinNT provider error.
    // Fail safe: treat as non-supervisor.
  }
  return false;
}

function escVal(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g,  '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
%>
=======
<%@ Language="JScript" %>
<%
/* ============================================================
   CPD Business Directory - Windows Authentication User Endpoint
   Classic ASP (JScript) for IIS on Windows Server 2012

   GET /api/user.asp
   Returns the authenticated Windows username and whether the user
   is a member of the configured supervisor AD group.

   Requires IIS Windows Authentication to be enabled and Anonymous
   Authentication to be disabled (set in web.config).

   CONFIGURATION:
     SUPERVISOR_GROUP — Name of the AD security group whose members
                        are treated as supervisors. Must be a group
                        in the same domain. Direct members only;
                        nested group membership is not evaluated.
   ============================================================ */

// ---- Configuration ----
var SUPERVISOR_GROUP = "CPD-Supervisors";

// ---- Response headers ----
Response.ContentType = "application/json";
Response.CharSet = "utf-8";
Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");

// ---- Read IIS-provided identity ----
var authUser   = String(Request.ServerVariables("AUTH_USER")   || "");
var logonUser  = String(Request.ServerVariables("LOGON_USER")  || "");
var remoteAddr = String(Request.ServerVariables("REMOTE_ADDR") || "");

// Prefer LOGON_USER (set after Kerberos/NTLM handshake) over AUTH_USER
var identity = logonUser || authUser;

if (!identity) {
  Response.Status = "401 Unauthorized";
  Response.Write('{"ok":false,"error":"Not authenticated. Ensure IIS Windows Authentication is enabled and Anonymous Authentication is disabled."}');
  Response.End();
}

// ---- Parse DOMAIN\username ----
var domain   = "";
var username = identity;
var slash = identity.indexOf("\\");
if (slash !== -1) {
  domain   = identity.substring(0, slash);
  username = identity.substring(slash + 1);
}

// ---- Check supervisor group membership ----
var isSupervisor = false;
if (domain && username && SUPERVISOR_GROUP) {
  isSupervisor = checkGroupMembership(domain, username, SUPERVISOR_GROUP);
}

// ---- Return result ----
Response.Write(
  '{"ok":true' +
  ',"username":'       + '"' + escVal(username)      + '"' +
  ',"displayName":'    + '"' + escVal(identity)       + '"' +
  ',"domain":'         + '"' + escVal(domain)          + '"' +
  ',"isSupervisor":'   + (isSupervisor ? 'true' : 'false') +
  ',"ip":'             + '"' + escVal(remoteAddr)      + '"' +
  '}'
);

// ---- Helpers ----

function checkGroupMembership(domain, username, groupName) {
  /* Checks whether username is a direct member of groupName in the given
     domain using the WinNT ADSI provider. The application pool identity
     must have permission to enumerate group membership (any authenticated
     domain account can do this by default). */
  try {
    var oGroup = GetObject("WinNT://" + domain + "/" + groupName + ",group");
    var members = new Enumerator(oGroup.Members());
    var userLC = username.toLowerCase();
    for (; !members.atEnd(); members.moveNext()) {
      var member = members.item();
      if (String(member.Name).toLowerCase() === userLC) {
        return true;
      }
    }
  } catch(e) {
    // Group not found, permission denied, or WinNT provider error.
    // Fail safe: treat as non-supervisor.
  }
  return false;
}

function escVal(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g,  '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
%>
>>>>>>> origin/main
