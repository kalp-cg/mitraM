/**
 * Socket.io real-time synchronization handler
 * Enables multi-device instant data sync
 */

let connectedClients = 0;

function initializeSocket(io) {
  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🔌 Client connected: ${socket.id} (Total: ${connectedClients})`);

    // Send current connection count to all clients
    io.emit('client-count', { count: connectedClients });

    // Handle data change events from clients
    socket.on('update-data', (payload) => {
      // Broadcast to all OTHER clients
      socket.broadcast.emit('data-updated', payload);
    });

    socket.on('update-member', (payload) => {
      socket.broadcast.emit('member-updated', payload);
    });

    socket.on('update-report', (payload) => {
      socket.broadcast.emit('report-updated', payload);
    });

    // Handle cell edit in real-time
    socket.on('cell-editing', (payload) => {
      // Let other clients know someone is editing a cell
      socket.broadcast.emit('cell-being-edited', payload);
    });

    socket.on('cell-edit-done', (payload) => {
      socket.broadcast.emit('cell-edit-finished', payload);
    });

    socket.on('disconnect', () => {
      connectedClients--;
      console.log(`🔌 Client disconnected: ${socket.id} (Total: ${connectedClients})`);
      io.emit('client-count', { count: connectedClients });
    });
  });
}

module.exports = { initializeSocket };
