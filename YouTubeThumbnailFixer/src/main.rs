use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use image::{DynamicImage, ImageFormat};
use std::io::Cursor;
use regex::Regex;
use reqwest::Client;

#[get("/healthcheck")]
async fn echo() -> impl Responder {
    HttpResponse::Ok()
}

#[get("/")]
async fn youtube_thumbnail_cropper(req_body: String) -> impl Responder {
    println!("Cropping thumbnail: {}", req_body);
    let re = Regex::new(r"(?:[?&]v=|/embed/|/1/|/v/|https://(?:www\.)?youtu\.be/)([^&\n?#]+)").unwrap();
    // Use captures_iter to extract capture groups
    let video_id = re
        .captures_iter(&req_body)
        .filter_map(|cap| cap.get(1)) // Get capture group 1 if it exists
        .map(|m| m.as_str())
        .next(); // Get the first match (if any)

    if let None = video_id {
        return HttpResponse::BadRequest().body("There's no video ID in that URL. Please try again.");
    }

    let client = Client::new();
    let response = client.get(format!("https://img.youtube.com/vi/{}/0.jpg", video_id.unwrap().to_string()))
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();

    let img: DynamicImage = image::load_from_memory(&response).unwrap();

    let cropped_img = img.crop_imm(105, 45, 270, 270);

    HttpResponse::Ok().content_type("image/png").body(convert_image_to_buffer(cropped_img, ImageFormat::Png))
}

fn convert_image_to_buffer(img: DynamicImage, format: ImageFormat) -> Vec<u8> {
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), format).unwrap();
    return buf;
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting server on port 3000!!");
    HttpServer::new(|| {
        App::new()
            .service(echo)
            .service(youtube_thumbnail_cropper)
    })
        .bind(("0.0.0.0", 3000))?
        .run()
        .await
}