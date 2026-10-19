import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { programaId, userId, userName, userEmail, comment } = body;

    if (!programaId || !userName || !comment) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const commentsRef = collection(db, "programaComments");
    const newComment = {
      programaId,
      userId: userId || null,
      userName,
      userEmail: userEmail || null,
      comment,
      createdAt: serverTimestamp(),
    };

    await addDoc(commentsRef, newComment);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error guardando comentario:", error);
    return NextResponse.json({ error: "Error al guardar comentario" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programaId = searchParams.get("programaId");

    if (!programaId) {
      return NextResponse.json({ error: "Falta programaId" }, { status: 400 });
    }

    const commentsRef = collection(db, "programaComments");
    const q = query(
      commentsRef,
      where("programaId", "==", programaId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error obteniendo comentarios:", error);
    return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
  }
}
