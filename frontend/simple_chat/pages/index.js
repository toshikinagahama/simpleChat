import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';
import { userState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function Home(pageProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // console.log(password);
  };

  const handleLoginBtnClick = async (e) => {
    const res = await fetch('http://localhost:1323/get_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const json_data = await res.json();
    console.log(json_data);
    if (json_data != null) {
      setUser(json_data);
      router.push('/user');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Simple Chat sample</title>
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="m-4">
          <p>input name</p>
        </div>
        <input className="border-2" value={username} onChange={handleUsernameChange} />
        <div className="m-4">
          <p>input password</p>
        </div>
        <input
          className="border-2"
          value={password}
          type="password"
          onChange={handlePasswordChange}
        />
        <div className="m-8">
          <button className="text-2xl" onClick={handleLoginBtnClick}>
            Login
          </button>
        </div>
      </main>
    </div>
  );
}
