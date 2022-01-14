import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, messagesState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import Image from 'next/image';
import Auth from '../components/auth';
import MyNav from '../components/nav';
import { human_icon } from '../global';

export default function User(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const socketRef = useRef();
  const refMessages = useRef([]);

  const [isFetchData, setIsFetchData] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(async () => {
    const token = localStorage.getItem('token');
    socketRef.current = new WebSocket('ws://localhost:1323/ws');

    const res = await fetch('http://localhost:1323/restricted/get_messages', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
    if (res != null) {
      const json_data = await res.json().catch(() => null);
      console.log(json_data);
      if (json_data['result'] != null) {
        if (json_data['result'] === 0) {
          setMessages([]);
          setMessages(json_data['messages']);

          socketRef.current.addEventListener('open', function (e) {
            socketRef.current.send(JSON.stringify({ command: 0, data: { token } }));
          });

          // サーバーからデータを受け取る
          socketRef.current.addEventListener('message', function (e) {
            try {
              const json_data = JSON.parse(e.data);
              const command = json_data['command'];
              if (command != null) {
                switch (command) {
                  case 1:
                    console.log(json_data['data']);
                    setMessages([...refMessages.current, json_data['data']]);
                    console.log(refMessages.current);
                    break;
                  default:
                    break;
                }
              }
            } catch (error) {
              console.log(error);
            }
          });
        }
      }
    }

    return () => {
      console.log('Disconnecting..');
      socketRef.current.close();
      // removeListeners?.();
    };
  }, []);

  useEffect(() => {
    refMessages.current = [...messages];
    if (messages.length > 0) {
      let m = messages.slice(-1)[0];
      let rooms_new = [...rooms]; //更新用rooms
      console.log(m.CreatedAt);
      for (let i = 0; i < rooms_new.length; i++) {
        if (rooms_new[i].id == m.room_id) {
          rooms_new[i].num_unread++;
          rooms_new[i].last_message = m.message;
          rooms_new[i].last_update = new Date(m.CreatedAt);
        }
      }
      setRooms(rooms_new);
    }
  }, [messages]);

  useEffect(() => {
    if (user == null) {
      return;
    }
    // console.log(user);

    const fetchData = async () => {
      if (!isFetchData) {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:1323/restricted/get_rooms', {
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

  return (
    <Auth>
      {user == null ? (
        <div>Loading</div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <Head>
            <title>部屋一覧</title>
          </Head>
          <MyNav title="あなたの部屋" />
          <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100">
            {rooms.map((room, index) => {
              return (
                <Link href={'/room/' + room.id} key={index}>
                  <a className="w-full">
                    <div className="w-full border-b-2 border-zinc-300 py-4 flex">
                      <div className="">
                        <img
                          className="w-16 h-16 shadow-lg rounded-full mx-2 object-contain"
                          src={room.icon}
                          alt={''}
                        />
                      </div>
                      <div className="flex-grow text-left px-4 py-2 flex flex-col justify-center">
                        <p className="text-sm mb-1">{room.name}</p>
                        <p className="text-gray-400 text-sm mt-1">{room.last_message}</p>
                      </div>
                      <div className="px-4 py-2 flex flex-col justify-between">
                        <p className="text-sm mb-1">
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
                        )}
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
