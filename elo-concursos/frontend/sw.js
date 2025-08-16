self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: 'Novo concurso', body: event.data ? event.data.text() : 'Tem novidade' }; }
  const title = data.title || 'Novo concurso disponível';
  const options = {
    body: data.body || 'Clique para abrir o painel',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.matchAll({type:'window'}).then(winList => {
    for (const w of winList) if (w.url === url && 'focus' in w) return w.focus();
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
