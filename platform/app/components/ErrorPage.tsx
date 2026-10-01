import React from 'react';
import Link from 'next/link';

interface ErrorProps {
  statusCode: number;
  message: string;
}

const ErrorPage: React.FC<ErrorProps> = ({ statusCode, message }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{statusCode} - {message}</h1>
      <Link href="/">
        Go back home
      </Link>
    </div>
  );
};

export default ErrorPage;