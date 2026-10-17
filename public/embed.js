/* ProofFlow embed helper — open a project review link from any site */
(function () {
  var script = document.currentScript
  var projectId = script && script.getAttribute('data-project-id')
  var base = (script && script.getAttribute('data-base')) || window.location.origin
  if (!projectId) return

  var btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = 'Leave visual feedback'
  btn.style.cssText =
    'position:fixed;bottom:20px;right:20px;z-index:99999;padding:12px 16px;border:0;border-radius:999px;background:#0ea5e9;color:#fff;font:600 14px/1 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);cursor:pointer;'
  btn.onclick = function () {
    window.open(base.replace(/\/$/, '') + '/project/' + projectId, '_blank', 'noopener')
  }
  document.body.appendChild(btn)
})()
