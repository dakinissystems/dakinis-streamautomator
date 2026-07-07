/** @type {import('react-doctor').DoctorConfig} */
export default {
  deadCode: false,
  ignore: ['build/**', 'dist/**', 'node_modules/**'],
  rules: {
    'react-doctor/auth-token-in-web-storage': 'off',
  },
};
