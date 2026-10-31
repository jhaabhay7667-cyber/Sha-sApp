
import asyncio
import json
import websockets

CONVERSATION_ID = 1


async def listen(name, websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            event = data.get("type")

            if event == "typing":
                user = "Abhay" if data["user_id"] == 4 else "shasha"
                status = "is typing..." if data["is_typing"] else "stopped typing."
                print(f"\n[CHAT] {user} {status}")

            elif event == "presence":
                print(
                    f"\n[PRESENCE] User {data['user_id']} "
                    f"is {data['status']}"
                )

            elif event == "message":
                print(
                    f"\n[MESSAGE] User {data['sender_id']}: "
                    f"{data['content']}"
                )

            else:
                print(f"\n[{name}] {json.dumps(data, ensure_ascii=False)}")

    except websockets.exceptions.ConnectionClosed:
        print(f"\n{name} disconnected.")


async def main():
    print("========== SHA'SAPP TYPING TEST ==========")

    abhay_token = input("Abhay's new JWT token: ").strip()
    shasha_token = input("shasha's new JWT token: ").strip()

    if not abhay_token or not shasha_token:
        print("Both tokens are required.")
        return

    abhay_url = (
        f"ws://127.0.0.1:8000/ws/{CONVERSATION_ID}"
        f"?token={abhay_token}"
    )

    shasha_url = (
        f"ws://127.0.0.1:8000/ws/{CONVERSATION_ID}"
        f"?token={shasha_token}"
    )

    try:
        async with websockets.connect(abhay_url) as abhay_ws:
            print("\nAbhay connected!")

            async with websockets.connect(shasha_url) as shasha_ws:
                print("shasha connected!")
                print("\nCommands:")
                print("A = Abhay")
                print("S = shasha")
                print("exit = Stop test")

                tasks = [
                    asyncio.create_task(listen("ABHAY", abhay_ws)),
                    asyncio.create_task(listen("SHASHA", shasha_ws)),
                ]

                try:
                    while True:
                        choice = (
                            await asyncio.to_thread(
                                input, "\nChoose user (A/S): "
                            )
                        ).strip().lower()

                        if choice == "exit":
                            break

                        if choice not in ("a", "s"):
                            print("Choose A or S.")
                            continue

                        sender = abhay_ws if choice == "a" else shasha_ws

                        print("\n1. Start typing")
                        print("2. Stop typing")
                        print("3. Send message")

                        action = (
                            await asyncio.to_thread(
                                input, "Choose action: "
                            )
                        ).strip()

                        if action == "1":
                            await sender.send(json.dumps({
                                "type": "typing",
                                "is_typing": True,
                            }))
                            print("Typing started!")

                        elif action == "2":
                            await sender.send(json.dumps({
                                "type": "typing",
                                "is_typing": False,
                            }))
                            print("Typing stopped!")

                        elif action == "3":
                            content = await asyncio.to_thread(
                                input, "Enter message: "
                            )
                            await sender.send(json.dumps({
                                "type": "message",
                                "content": content,
                            }))

                        else:
                            print("Invalid action.")

                finally:
                    for task in tasks:
                        task.cancel()

                    await asyncio.gather(*tasks, return_exceptions=True)

    except Exception as error:
        print("\nConnection error:", error)


if __name__ == "__main__":
    asyncio.run(main())
