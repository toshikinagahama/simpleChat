import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { userState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import { domain_db, http_protcol } from '../global';

const Auth = ({ children }) => {
  const [user, setUser] = useRecoilState(userState);
  const [component, setComponent] = useState(<div>Loading...</div>);
  const [isFetchData, setIsFetchData] = useState(false);

  const router = useRouter();
  const isReady = router.isReady;
  if (!isReady) {
    return <div>Loading...</div>;
  }
  const token = localStorage.getItem('token');

  if (token == 'null') {
    router.push('/login');
  } else if (token == null) {
    router.push('/login');
  }
  useEffect(() => {
    const fetchData = async () => {
      //console.log(token);
      if (token != 'null' && token != null) {
        setComponent(children);
        if (!isFetchData) {
          const res = await fetch(`${http_protcol}://${domain_db}/restricted/auth_user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => null);
          if (res != null) {
            const json_data = await res.json().catch(() => null);
            console.log(json_data);
            if (json_data['result'] != null) {
              setIsFetchData(true);
              setUser(json_data['user']);
            } else {
              router.replace('/');
            }
          }
        }
      }
    };
    fetchData();
  }, [children, user]);

  //何もなければ次へ（そのまま処理）
  return component;
};

export default Auth;
