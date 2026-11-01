import { Link as RouterLink } from 'react-router-dom';

// UI components can keep using a simple href prop while React Router handles navigation.
export default function Link({ href, ...props }) {
  return <RouterLink to={href} {...props} />;
}
