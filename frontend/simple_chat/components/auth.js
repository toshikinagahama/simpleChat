import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const Auth = ({ children }) => {
  const [component, setComponent] = useState(<div>Loading...</div>);
  const router = useRouter();
  useEffect(async () => {
    const token = localStorage.getItem('token');

    if (token == null) router.replace('/');
    else {
      setComponent(children);
    }
    const res = await fetch('http://localhost:1323/restricted/auth_user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
    if (res != null) {
      const json_data = await res.json().catch(() => null);
      console.log(json_data);
      if (json_data['result'] != null) {
        setComponent(children);
      } else {
        router.replace('/');
      }
    }
  }, []);

  //何もなければ次へ（そのまま処理）
  return component;
};

export default Auth;
