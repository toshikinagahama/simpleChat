import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { countState, userState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function Home(pageProps) {
  const [username, setUsername] = useState("");
  const [user, setUser] = useRecoilState(userState);
  useEffect(() => {
    setTimeout(() => {
      var socket = new WebSocket('ws://192.168.10.17:1323/ws');
      // 接続
      socket.addEventListener('open', function (e) {
        setUser({ ...user, ...{ age: 100 } });
        console.log('Socket 接続成功');
      });

      // サーバーからデータを受け取る
      socket.addEventListener('message', function (e) {
        console.log(e.data);
      });
    }, 5000);
  }, []);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    // console.log(username);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Simple Chat sample</title>
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className='m-4'><p>input your name</p></div>
        <input className='border-2' value={username} onChange={handleUsernameChange}/>
        <div className='m-8'>
        <Link href="/users/0">
          <a className='text-2xl'>Login</a>
        </Link>
        </div>
      </main>

    </div>
  );
}
