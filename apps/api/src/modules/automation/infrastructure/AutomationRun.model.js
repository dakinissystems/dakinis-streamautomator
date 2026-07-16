/**
 * Persisted automation rule execution log (per trigger fire).
 */

import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

const AutomationRun = sequelize.define(
  'AutomationRun',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    triggerType: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'ok',
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'AutomationRuns',
    indexes: [{ fields: ['userId', 'ruleId', 'createdAt'] }],
  },
);

export default AutomationRun;
