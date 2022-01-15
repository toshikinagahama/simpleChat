import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, messagesState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import Image from 'next/image';
import Auth from '../components/auth';
import MyNav from '../components/nav';
import { domain_db, domain, human_icon } from '../global';
import QRCode from 'qrcode.react';

export default function AddFriends(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);

  const id = router.query.id;
  console.log(id);

  const handleAddFriendBtnClick = (e) => {
    //処理
  };

  useEffect(() => {
    if (user == null) {
      return;
    }
  }, [user]);

  console.log(user);

  return (
    <Auth>
      {user == null ? (
        <div>Loading</div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <Head>
            <title>自分の設定</title>
          </Head>
          <MyNav title="友だち追加" />
          <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100 space-y-16">
            <div></div>
            <div></div>
            <div></div>
            <button
              className="text-xl text-white px-8 py-2 rounded-sm bg-green-500"
              onClick={handleAddFriendBtnClick}
            >
              友だちに追加する
            </button>
          </main>
        </div>
      )}
    </Auth>
  );
}
