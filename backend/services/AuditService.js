import { query } from '../db.js';

export const AuditService = {
    /**
     * Log a system action
     * @param {Object} params
     * @param {string} params.action - Action Type (e.g. 'APPEAL_UPDATE')
     * @param {string} params.entityId - ID of the entity changed
     * @param {string} params.entityType - 'appeal', 'achievement', 'lost_item'
     * @param {string} params.actorId - ID of user performing action
     * @param {string} params.actorRole - Role of user
     * @param {Object} params.changes - Details of change { old: 'Pending', new: 'Approved' }
     * @param {Object} params.metadata - Extra context { security_note: 'Found it' }
     */
    log: async ({ action, entityId, entityType, actorId, actorRole, changes = {}, metadata = {} }) => {
        try {
            console.log(`[Audit] Logging ${action} by ${actorId} on ${entityType}:${entityId}`);

            await query(`
                INSERT INTO audit_logs (action_type, entity_id, entity_type, actor_id, actor_role, changes, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [action, String(entityId), entityType, actorId, actorRole, changes, metadata]);

        } catch (err) {
            console.error('[Audit] Failed to log action:', err);
            // Don't crash main flow if audit fails, but log error
        }
    }
};
