import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { userState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function User(pageProps) {
  const [user, setUser] = useRecoilState(userState);
  useEffect(() => {
    console.log(user);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Home</title>
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="m-4">
          <p>Hi!</p>
        </div>
      </main>
    </div>
  );
}
