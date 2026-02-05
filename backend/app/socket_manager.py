"""
Mo's Burritos - Socket.IO Manager for Real-Time Updates
Handles WebSocket connections for order status updates and kitchen notifications
"""
import socketio
from .config import settings
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create Socket.IO AsyncServer
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.cors_origins_list,
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
)

# Create ASGI app (will be used to wrap FastAPI app)
socket_app = socketio.ASGIApp(sio)


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    return True


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def join_order_room(sid, data):
    """
    Customer joins a specific order room to receive real-time updates

    Args:
        data: dict with 'order_id' key
    """
    try:
        order_id = data.get('order_id')
        if not order_id:
            logger.warning(f"join_order_room called without order_id by {sid}")
            return {'success': False, 'error': 'order_id required'}

        room = f"order:{order_id}"
        sio.enter_room(sid, room)
        logger.info(f"Client {sid} joined order room: {room}")

        return {'success': True, 'room': room}
    except Exception as e:
        logger.error(f"Error joining order room: {e}")
        return {'success': False, 'error': str(e)}


@sio.event
async def leave_order_room(sid, data):
    """
    Customer leaves order room

    Args:
        data: dict with 'order_id' key
    """
    try:
        order_id = data.get('order_id')
        if not order_id:
            return {'success': False, 'error': 'order_id required'}

        room = f"order:{order_id}"
        sio.leave_room(sid, room)
        logger.info(f"Client {sid} left order room: {room}")

        return {'success': True, 'room': room}
    except Exception as e:
        logger.error(f"Error leaving order room: {e}")
        return {'success': False, 'error': str(e)}


@sio.event
async def join_kitchen_room(sid, data):
    """
    Kitchen staff joins location-specific room for new order notifications

    Args:
        data: dict with 'location_id' key
    """
    try:
        location_id = data.get('location_id')
        if not location_id:
            logger.warning(f"join_kitchen_room called without location_id by {sid}")
            return {'success': False, 'error': 'location_id required'}

        room = f"kitchen:{location_id}"
        sio.enter_room(sid, room)
        logger.info(f"Client {sid} joined kitchen room: {room}")

        return {'success': True, 'room': room}
    except Exception as e:
        logger.error(f"Error joining kitchen room: {e}")
        return {'success': False, 'error': str(e)}


@sio.event
async def leave_kitchen_room(sid, data):
    """
    Kitchen staff leaves kitchen room

    Args:
        data: dict with 'location_id' key
    """
    try:
        location_id = data.get('location_id')
        if not location_id:
            return {'success': False, 'error': 'location_id required'}

        room = f"kitchen:{location_id}"
        sio.leave_room(sid, room)
        logger.info(f"Client {sid} left kitchen room: {room}")

        return {'success': True, 'room': room}
    except Exception as e:
        logger.error(f"Error leaving kitchen room: {e}")
        return {'success': False, 'error': str(e)}


# Helper functions for emitting events

async def emit_order_status_update(order_id: str, order_data: dict):
    """
    Emit order status update to all clients in the order's room

    Args:
        order_id: UUID of the order
        order_data: Full order object as dict
    """
    try:
        room = f"order:{order_id}"
        await sio.emit('order_status_updated', order_data, room=room)
        logger.info(f"Emitted order_status_updated to room {room}")
    except Exception as e:
        logger.error(f"Error emitting order status update: {e}")


async def emit_new_order(location_id: str, order_data: dict):
    """
    Emit new order notification to kitchen room

    Args:
        location_id: UUID of the location
        order_data: Full order object as dict
    """
    try:
        room = f"kitchen:{location_id}"
        await sio.emit('new_order_created', order_data, room=room)
        logger.info(f"Emitted new_order_created to room {room}")
    except Exception as e:
        logger.error(f"Error emitting new order: {e}")


async def emit_order_cancelled(order_id: str, order_data: dict):
    """
    Emit order cancellation to order room

    Args:
        order_id: UUID of the order
        order_data: Full order object as dict with cancelled status
    """
    try:
        room = f"order:{order_id}"
        await sio.emit('order_status_updated', order_data, room=room)
        logger.info(f"Emitted order cancellation to room {room}")
    except Exception as e:
        logger.error(f"Error emitting order cancellation: {e}")
