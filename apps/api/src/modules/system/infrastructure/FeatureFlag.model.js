import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

const FeatureFlag = sequelize.define('FeatureFlag', {
  tenantId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'tenant_id',
    comment: 'Null = global flag',
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Feature flag key (e.g., youtube_publish, bulk_upload)',
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the feature is enabled',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this feature flag controls',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional configuration for the feature',
  },
}, {
  indexes: [
    { unique: true, fields: ['tenantId', 'key'], name: 'feature_flags_tenant_key_unique' },
    { fields: ['enabled'] },
  ],
});

export default FeatureFlag;

