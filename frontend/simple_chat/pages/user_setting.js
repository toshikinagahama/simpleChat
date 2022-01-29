import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import Auth from '../components/auth';
import MyNav from '../components/nav';
import { domain_db, domain, http_protcol, human_icon } from '../global';
import QRCode from 'qrcode.react';

export default function UserSetting(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);

  const [isFetchData, setIsFetchData] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (user == null) {
      return;
    }

    const fetchData = async () => {
      if (!isFetchData) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${http_protcol}://${domain_db}/restricted/get_rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            room_ids: user.room_ids,
          }),
        }).catch(() => null);
        if (res != null) {
          const json_data = await res.json().catch(() => null);
          if (json_data['result'] != null) {
            if (json_data['result'] === 0) {
              const res_rooms = json_data['rooms'];
              setIsFetchData(true);
              const rooms_new = [];
              res_rooms.map((r, index) => {
                if (r.icon == '') {
                  r.icon = human_icon;
                }
                rooms_new.push({
                  id: r.id,
                  name: r.name,
                  icon: r.icon,
                  num_unread: 0,
                  last_update: new Date(),
                  last_message: '',
                });
              });
              setRooms([...rooms, ...rooms_new]);
            }
          }
        }
      }
    };
    fetchData();
  }, [rooms, user]);

  console.log(user);

  return (
    <Auth>
      {user == null ? (
        <div>Loading</div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 font-mono flex flex-col items-center justify-center min-h-screen w-full">
          <Head>
            <title>自分の設定</title>
            <meta httpEquiv="cache-control" content="no-cache" />
            <meta httpEquiv="expires" content="0" />
            <meta httpEquiv="pragma" content="no-cache" />
          </Head>
          <MyNav title="自分の設定" />
          <div className="m-4"></div>
          <main className="flex flex-col items-center justify-start w-full flex-1 container bg-slate-50 bg-opacity-40 space-y-16">
            <div>
              <p>あなたの名前: {user.name}</p>
            </div>
            <div>
              <p>あなたのID: {user.id}</p>
            </div>
            <div>
              {/* <p>アイコンを変える</p>
              <div className="w-24 h-24 rounded-full bg-slate-400 bg-opacity-50">
                <img src={user.icon} width={120} height={120} />
              </div> */}
            </div>
            <div>
              <p>あなたのQRコード</p>
              <div>
                <QRCode value={`${http_protcol}://${domain}/add_user_to_room?id=${user.id}`} />
              </div>
            </div>
            {/* <p>シークレットコード：1234</p> */}
          </main>
        </div>
      )}
    </Auth>
  );
}
