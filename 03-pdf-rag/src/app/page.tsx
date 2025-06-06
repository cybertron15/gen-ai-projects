"use client"
import { useState, useRef, useEffect, FormEvent } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Send, FileText, Bot, User, X, Check, Trash, LoaderCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { UploadResponse } from "@/types"
import { HumanMessage, BaseMessage } from "@langchain/core/messages";

interface UploadedFile {
	selected: boolean
	size: number;
	uploadedAt: Date;
	pathname: string;
	url: string;
	downloadUrl: string
}

interface ChatMessage {
	role: "user" | "ai";
	content: string;
}

export default function PDFChat() {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
	const [fileDialogOpen, setFileDialogOpen] = useState(false)
	const [userQuery, setuserQuery] = useState("")
	const [isLoading, setisLoading] = useState(false)
	const [messages, setmessages] = useState<ChatMessage[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	const getFiles = () => {
		fetch("/api/files")
			.then((res) => res.json())
			.then((data: UploadedFile[]) => {

				if (!data) {
					toast.error("Failed to fetch files", {
						description: "An unknown error occurred",
					})
					return
				}
				const files = data.map((file, index) => (
					{
						...file,
						selected: false,
					}))

				setUploadedFiles(files);

			})
	}

	useEffect(() => {
		getFiles()

	}, [])
	const chat = async (e: FormEvent) => {
		e.preventDefault();
		let filter;
		const selectedFiles = uploadedFiles.filter((file) => file.selected);

		if (selectedFiles.length > 0) {
			filter = {
				should: selectedFiles.map((file) => ({
					key: "metadata.source",
					match: { value: file.url },
				})),
			};
		} else {
			filter = {};
		}

		const sessionId = localStorage.getItem("chat-session-id") || crypto.randomUUID();
		localStorage.setItem("chat-session-id", sessionId);
		setmessages(prev => [...prev, { role: "user", content: userQuery }]);
		setisLoading(true);
		setuserQuery("");
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionId,
					query: userQuery,
					filter
				}),
			});

			const data = await res.json();
			setmessages(prev => [...prev, { role: "ai", content: data.response }]);
		} catch (err) {
			console.error("Error sending chat", err);
		} finally {
			setisLoading(false);
		}
	};

	const isFileOversized = (files: File[]) => {
		const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
		const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
		if (oversizedFiles.length > 0) {
			toast.error("File size exceeds 5MB", {
				description: `The following files are too large: ${oversizedFiles.map(file => file.name).join(", ")}`,
			})
			return true;
		}
		return false;
	}

	const uploadFiles = (formData: FormData, loadingToastId: string | number) => {
		fetch("/api/upload", {
			method: "POST",
			body: formData,
		})
			.then(async (res) => {
				const data: UploadResponse = await res.json();

				if (!res.ok || !data.success) {
					console.error("File upload failed\n", data.error?.detail);
					toast.error("Failed to upload file", {
						id: loadingToastId,
						description: res.status === 409 ? "File already exists" : "An unknown error occurred",
					});
					return;
				}

				// Handle successful upload
				console.log("File uploaded successfully:", data);
				toast.success("File uploaded successfully", {
					id: loadingToastId,
					description: `${formData.getAll("files").length} file(s) uploaded`,
				});

				// Update the list of uploaded files
				getFiles()
			})
			.catch((error) => {
				console.error("Server Error: Failed to upload file", error);
				toast.error("Failed: server error", {
					id: loadingToastId,
					description: "An unknown error occurred",
				});
			});
	}

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			const files = Array.from(event.target.files)

			// Check for oversized files
			if (isFileOversized(files)) return

			const formData = new FormData();

			Array.from(files).forEach((file) => formData.append("files", file));

			const loadingToastId = toast.loading("Uploading files...")

			// Upload from the server
			uploadFiles(formData, loadingToastId)

		}
	}

	const toggleFileSelection = (index: number) => {
		setUploadedFiles((prev) => prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)))
	}

	const removeFiles = (urls: string[]) => {
		fetch("/api/deletefiles", {
			method: "DELETE",
			body: JSON.stringify({
				urls: urls
			})
		}).then(() => {
			toast.success("File deleted successfully", {
				description: `${urls.length} file(s) has been deleted successfully`,
			})
			setUploadedFiles((prev) => prev.filter((file) => !urls.includes(file.url)))
		})
			.catch((error) => {
				console.error("Server Error: Failed to delete file", error);
				toast.error("Failed: server error", {
					description: "An unknown error occurred",
				});
			})

	}

	const openFileDialog = () => setFileDialogOpen(true)
	const closeFileDialog = () => setFileDialogOpen(false)

	const selectAllFiles = () => {
		setUploadedFiles((prev) => prev.map((item) => ({ ...item, selected: true })))
	}

	const deselectAllFiles = () => {
		setUploadedFiles((prev) => prev.map((item) => ({ ...item, selected: false })))
	}

	return (
		<div className="flex flex-col items-center min-h-screen p-4 bg-gray-50">
			<Card className="relative w-full max-w-3xl shadow-lg overflow-hidden">
				<CardHeader className="border-b">
					<CardTitle className="text-2xl">PDF Chat Assistant</CardTitle>
					<CardDescription>Upload multiple PDFs and ask questions about their contents</CardDescription>
				</CardHeader>

				<CardContent className="p-4 h-[55vh] overflow-y-auto">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
							<FileText size={48} className="mb-4" />
							<p className="mb-2 text-lg font-medium">No conversation yet</p>
							<p>Upload PDFs and start asking questions about them</p>
						</div>
					) : (
						<div className="space-y-4">
							{messages.map((message, index) => (
								<div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
									<div
										className={`max-w-[80%] p-3 rounded-lg ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
											}`}
									>
										<div className="flex items-center gap-2 mb-1">
											{message.role === "user" ? <User size={16} /> : <Bot size={16} />}
											<span className="font-medium">{message.role === "user" ? "You" : "AI Assistant"}</span>
										</div>
										<div className="whitespace-pre-wrap">{message.content}</div>


									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-start items-center p-4">
									<LoaderCircle className="animate-spin rounded-full h-6 w-6"/>
								</div>
							)}
						</div>
					)}
				</CardContent>

				<CardFooter className="border-t p-4">
					<div className="w-full space-y-2">
						{/* File selector dialog */}
						<Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Select PDFs for your question</DialogTitle>
									<DialogDescription>Choose which documents to include in your current query</DialogDescription>
								</DialogHeader>

								<div className="pt-4">
									<div className="flex justify-between items-center mb-2 gap-2 px-2">
										{
											uploadedFiles.some((item) => item.selected) &&
											<>
												<Checkbox
													checked={uploadedFiles.every((item) => item.selected)}
													onCheckedChange={(checked) => {
														if (checked) {
															selectAllFiles()
														} else {
															deselectAllFiles()
														}
													}}
												/>
												< Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => removeFiles(uploadedFiles.filter((item) => item.selected).map((item) => item.url))}
												>
													<Trash color="red" size={14} />
												</Button>
											</>

										}

									</div>

									<ScrollArea className="h-[300px]">
										<div className="space-y-2">
											{uploadedFiles.length === 0 ? (
												<p className="text-sm text-muted-foreground text-center py-4">No PDFs uploaded yet</p>
											) : (
												uploadedFiles.map((item, index) => (
													<div key={index} className="flex items-center justify-between gap-2 p-2 border h-10 rounded-md max-w-[400px]">
														<div className="flex items-center gap-2 overflow-hidden flex-1">
															<Checkbox
																id={`dialog-file-${index}`}
																checked={item.selected}
																onCheckedChange={() => toggleFileSelection(index)}
															/>
															<label
																htmlFor={`dialog-file-${index}`}
																className="text-sm truncate cursor-pointer flex-1"
															>
																<FileText size={14} className="inline mr-1" />
																{item.pathname.replace(/\d.+_/g, "")}
															</label>
														</div>

														< Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-6 w-6"
															onClick={() => removeFiles([item.url])}
														>
															<Trash color="red" size={14} />
														</Button>
													</div>
												))
											)}
										</div>
									</ScrollArea>
								</div>

								<DialogFooter>
									<Button type="button" onClick={closeFileDialog}>
										Done
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<div className="flex items-center gap-2">
							<div className="flex gap-1">
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => fileInputRef.current?.click()}
									className="shrink-0 cursor-pointer"
									title="Upload PDFs"
								>
									<Upload size={18} />
								</Button>
								<Button
									type="button"
									variant={uploadedFiles.filter((f) => f.selected).length > 0 ? "secondary" : "outline"}
									size="icon"
									onClick={openFileDialog}
									className="shrink-0 relative cursor-pointer"
									disabled={uploadedFiles.length === 0}
									title="Select PDFs"
								>
									<FileText size={18} />
									{uploadedFiles.filter((f) => f.selected).length > 0 && (
										<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
											{uploadedFiles.filter((f) => f.selected).length}
										</span>
									)}
								</Button>
								<input
									type="file"
									accept="application/pdf"
									className="hidden"
									onChange={handleFileChange}
									ref={fileInputRef}
									multiple
								/>
							</div>
							<form onSubmit={chat} className="flex items-center flex-1 gap-2">
								<Input
									value={userQuery}
									onChange={(e) => setuserQuery(e.target.value)}
									placeholder={uploadedFiles.length > 0 ? "Ask a question about the PDFs..." : "Upload PDFs first..."}
									className=" resize-none "
								// disabled={uploadedFiles.length === 0 || uploadedFiles.filter((f) => f.selected).length === 0}
								/>

								<Button
									type="submit"
									size="icon"
									disabled={
										isLoading ||
										uploadedFiles.length === 0 ||
										uploadedFiles.filter((f) => f.selected).length === 0 ||
										!userQuery.trim()
									}
									className="shrink-0 cursor-pointer"

								>
									<Send size={18} />
								</Button>
							</form>
						</div>

						{/* Show file count summary */}
						{uploadedFiles.length > 0 && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
								<FileText size={14} />
								<span>
									{uploadedFiles.length} PDF{uploadedFiles.length !== 1 ? "s" : ""} uploaded
									{uploadedFiles.filter((f) => f.selected).length > 0 &&
										` (${uploadedFiles.filter((f) => f.selected).length} selected)`}
								</span>
							</div>
						)}
					</div>
				</CardFooter>
			</Card >
		</div >
	)
}
