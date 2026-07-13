/**
 * IF/THEN automation rules for creator workflows (stream.started, stream.scheduled, …).
 */

import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

const AutomationRule = sequelize.define(
  'AutomationRule',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    triggerType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'e.g. stream.started, stream.scheduled, stream.ended',
    },
    triggerConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Optional filters (platform, contentType, …)',
    },
    actions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of { type, params } action steps',
    },
  },
  {
    tableName: 'AutomationRules',
    indexes: [{ fields: ['userId', 'triggerType'] }],
  },
);

export default AutomationRule;
