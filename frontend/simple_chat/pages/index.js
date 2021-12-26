import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { countState, userState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function Home(pageProps) {
  const [count, setCount] = useRecoilState(countState);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Simple Chat sample</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <p>{user.age}</p>
        <Link href="/rooms/room1">
          <a>room1</a>
        </Link>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <a
          className="flex items-center justify-center"
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <img src="/vercel.svg" alt="Vercel Logo" className="h-4 ml-2" />
        </a>
      </footer>
    </div>
  );
}
