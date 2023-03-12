import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import Auth from '../components/auth';
import MyNav from '../components/nav';
import { domain_db, http_protcol, human_icon, web_push_pub_key } from '../global';
import { MdMeetingRoom } from 'react-icons/md';
import { base64ToUint8Array } from '../func';

export default function User(pageProps) {
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if ('Notification' in window) {
      // 通知が許可されていたら早期リターン
      const permission = Notification.permission;
      if (permission === 'denied' || permission === 'granted') {
        //return;
      }
      // 通知の許可を求める
      Notification.requestPermission().then(() => {});
    }
    navigator.serviceWorker.register('/sw.js').then(async () => {
      console.log('hello');
      navigator.serviceWorker.ready.then(async (reg) => {
        let subscription = await reg.pushManager.getSubscription();
        console.log(JSON.stringify(subscription));
        let data = {
          subscription: JSON.stringify(subscription),
        };
        const res = await fetch(`${http_protcol}://${domain_db}/restricted/update_user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }).catch(() => null);
        if (res != null) {
          console.log(res);
          const json_data = await res.json().catch(() => null);
          console.log(json_data);
          if (json_data['result'] != null) {
            if (json_data['result'] === 0) {
            }
          }
        }
        if (!subscription) {
          let pubkey = web_push_pub_key;
          let options = {
            userVisibleOnly: true,
            applicationServerKey: base64ToUint8Array(pubkey),
          };
          reg.pushManager.subscribe(options).then(async (sub) => {
            console.log(sub);
            const key = sub.getKey('p256dh');
            const token = sub.getKey('auth');
            const request = {
              endpoint: sub.endpoint,
              expirationTime: null,
              keys: {
                p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(key))),
                auth: btoa(String.fromCharCode.apply(null, new Uint8Array(token))),
              },
            };
            localStorage.setItem('subscription', JSON.stringify(request));
            console.log(JSON.stringify(request));
            let data = {
              subscription: JSON.stringify(request),
            };
            const res = await fetch(`${http_protcol}://${domain_db}/restricted/update_user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(data),
            }).catch(() => null);
            if (res != null) {
              console.log(res);
              const json_data = await res.json().catch(() => null);
              console.log(json_data);
              if (json_data['result'] != null) {
                if (json_data['result'] === 0) {
                }
              }
            }
          });
        } else {
          localStorage.setItem('subscription', JSON.stringify(subscription));
        }
      });
    });
  }, []);

  return (
    <Auth>
      {user == null ? (
        <div>Loading</div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 font-mono flex flex-col items-center justify-center min-h-screen w-full">
          <Head>
            <title>部屋一覧</title>
            <meta httpEquiv="cache-control" content="no-cache" />
            <meta httpEquiv="expires" content="0" />
            <meta httpEquiv="pragma" content="no-cache" />
          </Head>
          <MyNav title="あなたの部屋" />
          <main className="flex flex-col items-center justify-start w-full flex-1 container">
            <div className="m-4"></div>
            {rooms.map((room, index) => {
              return (
                <Link href={'/room/' + room.id} key={index} className="mt-4">
                  <a className="w-full">
                    <div className="w-full text-gray-700 border-[1px] border-opacity-30 rounded-md bg-slate-50 bg-opacity-40 py-4 flex mb-4">
                      <div className="flex flex-col justify-center items-center w-16 h-16 shadow-lg rounded-full bg-slate-50 bg-opacity-20 mx-2">
                        <div className="flex flex-row justify-center items-center rounded-full">
                          <MdMeetingRoom size="2.5rem" />
                        </div>
                      </div>
                      <div className="flex-grow text-left px-4 py-2 flex flex-col justify-center">
                        <p className="text-md mb-1">{room.name}</p>
                        <p className="text-gray-400 text-sm mt-1">{room.last_text}</p>
                      </div>
                      <div className="px-4 py-2 flex flex-col justify-between">
                        {/* <p className="text-sm mb-1">
                          {`${('0' + room.last_update.getHours()).slice(-2)}:${(
                            '0' + room.last_update.getMinutes()
                          ).slice(-2)}`}
                        </p>
                        {room.num_unread != 0 && (
                          <div className="rounded-full w-8 h-8 bg-green-500" key={room.id}>
                            <div className="flex flex-col w-full h-full justify-center">
                              <p className="text-sm text-white text-center">{room.num_unread}</p>
                            </div>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </main>
        </div>
      )}
    </Auth>
  );
}
